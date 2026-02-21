// pdf-parse v2 exposes a class-based API; require bypasses ESM interop issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse') as {
  PDFParse: new (opts: { data: Buffer }) => { getText(): Promise<{ text: string }> };
};
import { prisma } from '../lib/prisma';
import { getGeminiModel } from '../lib/gemini';
import { AppError } from '../utils/AppError';
import {
  AiChatInput,
  AiChatResponse,
  SkillGapResponse,
  DailyInsightResponse,
  SmartAssignInput,
  SmartAssignResponse,
  ExtractSkillsResult,
} from '../types';

/**
 * Role-based skill requirements map
 * Defines expected skills for each role
 */
const ROLE_REQUIREMENTS: Record<string, string[]> = {
  Engineer: ['JavaScript', 'React', 'Node.js', 'Git', 'SQL'],
  Designer: ['Figma', 'CSS', 'UI/UX', 'Prototyping'],
  Manager: ['Communication', 'Planning', 'Leadership', 'Reporting'],
  Default: ['Communication', 'Documentation'],
};

/**
 * Get cached AI response if not expired
 * 
 * @param orgId - Organization ID
 * @param cacheKey - Cache key
 * @returns Cached value or null
 */
async function getCachedResponse(orgId: string, cacheKey: string): Promise<string | null> {
  const cached = await prisma.aiCache.findUnique({
    where: {
      orgId_cacheKey: {
        orgId,
        cacheKey,
      },
    },
  });

  if (!cached) {
    return null;
  }

  if (cached.expiresAt && cached.expiresAt < new Date()) {
    await prisma.aiCache.delete({
      where: {
        id: cached.id,
      },
    });
    return null;
  }

  return cached.content;
}

/**
 * Cache AI response with expiration
 * 
 * @param orgId - Organization ID
 * @param cacheKey - Cache key
 * @param value - Value to cache
 * @param expiresInHours - Expiration time in hours
 */
async function cacheResponse(
  orgId: string,
  cacheKey: string,
  value: string,
  expiresInHours: number
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);

  await prisma.aiCache.upsert({
    where: {
      orgId_cacheKey: {
        orgId,
        cacheKey,
      },
    },
    create: {
      orgId,
      cacheKey,
      content: value,
      expiresAt,
    },
    update: {
      content: value,
      expiresAt,
    },
  });
}

/**
 * AI Chat - General HR intelligence assistant
 * No caching as questions are unique
 * 
 * @param input - Chat question
 * @param orgId - Organization ID
 * @returns AI-generated answer
 */
export const aiChat = async (
  input: AiChatInput,
  orgId: string
): Promise<AiChatResponse> => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  const employees = await prisma.employee.findMany({
    where: { orgId },
    select: {
      name: true,
      role: true,
      skills: true,
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  const teamData = employees.map(emp => ({
    name: emp.name,
    role: emp.role,
    skills: emp.skills,
    taskCount: emp.tasks.length,
    completedTasks: emp.tasks.filter(t => t.status === 'COMPLETED').length,
  }));

  const teamJson = JSON.stringify(teamData).slice(0, 1500);

  const prompt = `You are an HR intelligence assistant for ${org?.name || 'this organization'}.

Here is the team data: ${teamJson}

Answer in 3-5 sentences: ${input.question}`;

  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const answer = result.response.text();

  return { answer };
};

/**
 * Skill Gap Analysis
 * Analyzes missing skills per employee based on role requirements
 * Cached for 24 hours
 * 
 * @param orgId - Organization ID
 * @returns Skill gaps and organizational recommendation
 */
export const analyzeSkillGap = async (orgId: string, forceRefresh = false): Promise<SkillGapResponse> => {
  const cacheKey = 'skill-gap';

  if (!forceRefresh) {
    const cached = await getCachedResponse(orgId, cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  const employees = await prisma.employee.findMany({
    where: { orgId },
    select: {
      name: true,
      role: true,
      skills: true,
    },
  });

  const employeeData = employees.map(emp => {
    const requiredSkills = ROLE_REQUIREMENTS[emp.role] || ROLE_REQUIREMENTS.Default;
    const currentSkills = emp.skills;
    const missingSkills = requiredSkills.filter(skill => !currentSkills.includes(skill));

    return {
      name: emp.name,
      role: emp.role,
      currentSkills,
      requiredSkills,
      missingSkills,
    };
  });

  const prompt = `Return only valid JSON, no markdown formatting or code blocks.

Analyze skill gaps for these employees: ${JSON.stringify(employeeData)}

Return in this exact format:
{
  "gaps": [{"employeeName": "string", "role": "string", "missingSkills": ["string"]}],
  "orgRecommendation": "string"
}`;

  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  let responseText = result.response.text().trim();

  responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsedResponse: SkillGapResponse;
  try {
    parsedResponse = JSON.parse(responseText);
  } catch (error) {
    throw new AppError('Failed to parse AI response', 500);
  }

  await cacheResponse(orgId, cacheKey, JSON.stringify(parsedResponse), 24);

  return parsedResponse;
};

/**
 * Daily Insight
 * Generates actionable HR insight based on organization statistics
 * Cached for 24 hours
 * 
 * @param orgId - Organization ID
 * @returns Daily HR insight
 */
export const getDailyInsight = async (orgId: string, forceRefresh = false): Promise<DailyInsightResponse> => {
  const cacheKey = 'daily-insight';

  if (!forceRefresh) {
    const cached = await getCachedResponse(orgId, cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  const [employeeCount, tasks] = await Promise.all([
    prisma.employee.count({ where: { orgId } }),
    prisma.task.findMany({
      where: { orgId },
      select: {
        status: true,
        employee: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const completionRate = tasks.length > 0 
    ? Math.round((completedTasks / tasks.length) * 100) 
    : 0;

  const tasksByEmployee: Record<string, number> = {};
  tasks.forEach(task => {
    const name = task.employee.name;
    tasksByEmployee[name] = (tasksByEmployee[name] || 0) + 1;
  });

  const topPerformer = Object.entries(tasksByEmployee)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

  const stats = {
    employeeCount,
    totalTasks: tasks.length,
    completionRate,
    topPerformer,
  };

  const prompt = `Give one actionable HR insight in exactly 2 sentences for this organization:

Employee count: ${stats.employeeCount}
Total tasks: ${stats.totalTasks}
Completion rate: ${stats.completionRate}%
Top performer: ${stats.topPerformer}

Provide a practical, data-driven recommendation.`;

  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const insight = result.response.text().trim();

  const response = { insight };
  await cacheResponse(orgId, cacheKey, JSON.stringify(response), 24);

  return response;
};

/**
 * Smart Task Assignment
 * Recommends best employee for a task based on skills and workload
 * 
 * @param input - Task details
 * @param orgId - Organization ID
 * @returns Recommended employee and reasoning
 */
export const smartAssign = async (
  input: SmartAssignInput,
  orgId: string
): Promise<SmartAssignResponse> => {
  // Cache by normalized skill key (6-hour TTL)
  const cacheKey = `smart-assign:${input.skillRequired.toLowerCase().trim()}`;
  const cached = await getCachedResponse(orgId, cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const employees = await prisma.employee.findMany({
    where: { orgId },
    select: {
      name: true,
      role: true,
      skills: true,
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  const employeeData = employees.map(emp => ({
    name: emp.name,
    role: emp.role,
    skills: emp.skills,
    currentTaskCount: emp.tasks.length,
    activeTasks: emp.tasks.filter(t => t.status !== 'COMPLETED').length,
  }));

  const prompt = `Return only the employee name, no other text or explanation.

Task: "${input.taskTitle}"
Required skill: "${input.skillRequired}"

Available employees: ${JSON.stringify(employeeData)}

Who is the best person for this task? Return only their name.`;

  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const recommendedEmployee = result.response.text().trim();

  const reasonPrompt = `In one sentence, explain why ${recommendedEmployee} is best for task "${input.taskTitle}" requiring "${input.skillRequired}" given: ${JSON.stringify(employeeData)}`;

  const reasonResult = await model.generateContent(reasonPrompt);
  const reason = reasonResult.response.text().trim();

  const response = { recommendedEmployee, reason };
  await cacheResponse(orgId, cacheKey, JSON.stringify(response), 6);

  return response;
};

/**
 * Extract skills from a resume PDF using Gemini AI
 * Step 1 — pdf-parse converts the buffer to raw text
 * Step 2 — Gemini extracts structured skills data
 * Step 3 — JSON validated and returned
 * No caching — each upload is unique
 *
 * @param fileBuffer - In-memory PDF buffer from multer memoryStorage
 * @returns Extracted skills, candidate name, role, and summary
 * @throws AppError if PDF has no text or AI parsing fails
 */
export const extractSkillsFromPDF = async (
  fileBuffer: Buffer
): Promise<ExtractSkillsResult> => {
  // Step 1 — Parse PDF text using v2 class API
  const parser = new PDFParse({ data: fileBuffer });
  const pdfData = await parser.getText();
  const text = pdfData.text;

  if (!text || text.trim().length < 50) {
    throw new AppError(
      'Could not extract text from PDF. Please ensure the PDF contains readable text.',
      400
    );
  }

  const truncatedText = text.slice(0, 3000);

  // Step 2 — Gemini extraction
  const prompt = `You are a skills extraction expert.
Extract ALL technical and professional skills from this resume/CV text.
Return ONLY a valid JSON object with this exact structure, no markdown:
{
  "skills": ["skill1", "skill2", "skill3"],
  "name": "candidate full name or empty string",
  "role": "their most recent job title or empty string",
  "summary": "one sentence professional summary or empty string"
}

Rules:
- Skills should be specific: "React.js" not "frontend"
- Include both technical (tools, languages) and soft skills
- Maximum 20 skills
- If a skill appears multiple times, include it only once

Resume text:
${truncatedText}`;

  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Step 3 — Parse and validate JSON; strip markdown if Gemini wraps it
  let parsed: ExtractSkillsResult;
  try {
    const cleaned = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AppError('AI could not process this PDF', 500);
    }
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new AppError('AI could not process this PDF', 500);
    }
  }

  return {
    skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 20) : [],
    name: parsed.name || '',
    role: parsed.role || '',
    summary: parsed.summary || '',
  };
};
