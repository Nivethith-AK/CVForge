import type { ResumeAnalysis } from '@/src/types/resume';

function toTrimmedString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value).trim();
  }

  return '';
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => toTrimmedString(item)).filter((item) => item.length > 0);
  }

  const text = toTrimmedString(value);
  if (!text) {
    return [];
  }

  return text
    .split(/\r?\n|[;,•]/g)
    .map((item) => item.replace(/^[-*]\s*/, '').trim())
    .filter((item) => item.length > 0);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
}

function firstNonEmptyString(...values: unknown[]) {
  for (const value of values) {
    const text = toTrimmedString(value);
    if (text) {
      return text;
    }
  }

  return '';
}

function deriveAtsScore(payload: Record<string, any>, resumeText: string) {
  const explicitScore = Number(payload.atsScore ?? payload.score ?? payload.matchScore ?? payload.ATSScore);
  if (Number.isFinite(explicitScore)) {
    return Math.max(0, Math.min(100, Math.round(explicitScore)));
  }

  const skillCount = toStringArray(payload.skills ?? payload.keySkills ?? payload.coreSkills).length;
  const experienceCount = Array.isArray(payload.experience) ? payload.experience.length : 0;
  const textSignals = [
    /python|javascript|typescript|sql|node\.js|react|azure|aws|gcp|machine learning|data/i.test(resumeText),
    /project|experience|education|certification/i.test(resumeText),
  ].filter(Boolean).length;

  const score = 48 + skillCount * 5 + experienceCount * 4 + textSignals * 8;
  return Math.max(35, Math.min(92, Math.round(score)));
}

function normalizeResumeAnalysis(payload: Record<string, any>, resumeText = ''): ResumeAnalysis {
  const skills = uniqueStrings(toStringArray(payload.skills ?? payload.keySkills ?? payload.coreSkills ?? payload.technicalSkills));
  const strengths = uniqueStrings(toStringArray(payload.strengths ?? payload.keyStrengths ?? payload.highlights ?? payload.positiveSignals));
  const weaknesses = uniqueStrings(toStringArray(payload.weaknesses ?? payload.improvementAreas ?? payload.gaps ?? payload.concerns));
  const missingSkills = uniqueStrings(toStringArray(payload.missingSkills ?? payload.skillGaps ?? payload.skillsToAdd ?? payload.skillsMissing));
  const improvements = uniqueStrings(
    toStringArray(payload.improvements ?? payload.recommendations ?? payload.nextSteps ?? payload.actionableNextSteps ?? payload.suggestions)
  );
  const recommendedRoles = uniqueStrings(
    toStringArray(payload.recommendedRoles ?? payload.targetRoles ?? payload.roles ?? payload.roleSuggestions)
  );

  const summary =
    firstNonEmptyString(payload.summary, payload.executiveSummary, payload.professionalSummary, payload.profileSummary) ||
    `Candidate${firstNonEmptyString(payload.name, payload.fullName, payload.candidateName) ? ` ${firstNonEmptyString(payload.name, payload.fullName, payload.candidateName)}` : ''}${firstNonEmptyString(payload.title, payload.role, payload.professionalTitle, payload.targetRole) ? ` is a ${firstNonEmptyString(payload.title, payload.role, payload.professionalTitle, payload.targetRole)}` : ''}${skills.length ? ` with skills in ${skills.slice(0, 4).join(', ')}` : ''}.`;

  const resolvedStrengths = strengths.length
    ? strengths
    : uniqueStrings([
        firstNonEmptyString(payload.title, payload.role, payload.professionalTitle, payload.targetRole)
          ? `Focused ${firstNonEmptyString(payload.title, payload.role, payload.professionalTitle, payload.targetRole)} profile`
          : 'Clear professional profile',
        skills.length ? `Relevant skills include ${skills.slice(0, 4).join(', ')}` : 'Contains transferable technical experience',
        resumeText ? 'Resume text was successfully extracted' : 'Text extraction completed',
      ]);

  const resolvedWeaknesses = weaknesses.length
    ? weaknesses
    : uniqueStrings([
        skills.length < 5 ? 'Add more role-specific keywords if they are accurate' : '',
        'Strengthen impact metrics and measurable outcomes',
      ]);

  const resolvedMissingSkills = missingSkills.length
    ? missingSkills
    : uniqueStrings([
        'Quantifiable achievements',
        'Role-specific ATS keywords',
        skills.length ? '' : 'Technical skills aligned to the target role',
      ]);

  const resolvedImprovements = improvements.length
    ? improvements
    : uniqueStrings([
        'Tailor the summary to the target role',
        'Add stronger bullet points with measurable outcomes',
        'Place the most relevant technical skills near the top',
      ]);

  const resolvedRecommendedRoles = recommendedRoles.length
    ? recommendedRoles
    : uniqueStrings([
        firstNonEmptyString(payload.title, payload.role, payload.professionalTitle, payload.targetRole) || (skills.includes('Python') ? 'Data Analyst' : ''),
        skills.includes('Python') || skills.includes('SQL') ? 'AI Engineer' : '',
        skills.includes('Node.js') ? 'Full Stack Developer' : '',
        'Resume-tailored professional roles',
      ]);

  const tailoredResume = firstNonEmptyString(payload.tailoredResume) || resumeText;

  return {
    atsScore: deriveAtsScore(payload, resumeText),
    strengths: resolvedStrengths,
    weaknesses: resolvedWeaknesses,
    missingSkills: resolvedMissingSkills,
    improvements: resolvedImprovements,
    recommendedRoles: resolvedRecommendedRoles,
    summary,
    tailoredResume,
  };
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  const response = await fetch('/api/analyze-resume', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: resumeText }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to analyze resume.');
  }

  return normalizeResumeAnalysis((await response.json()) as Record<string, any>, resumeText);
}

export async function analyzeResumeStream(
  resumeText: string,
  onProgress: (progress: number, stage: string) => void
): Promise<ResumeAnalysis> {
  const response = await fetch('/api/analyze-resume-stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: resumeText }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to analyze resume.');
  }

  if (!response.body) {
    throw new Error('No response body for streaming.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result: ResumeAnalysis | null = null;
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || ''; // Keep incomplete event in buffer

      for (const eventStr of events) {
        if (!eventStr.trim()) continue;

        const lines = eventStr.split('\n');
        let eventType = '';
        let eventData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            eventData = line.slice(6).trim();
          }
        }

        if (eventType && eventData) {
          let data;
          try {
            data = JSON.parse(eventData);
          } catch (parseErr) {
            console.error('Failed to parse event data:', eventData, parseErr);
            continue;
          }

          if (eventType === 'progress') {
            onProgress(data.percent, data.stage);
          } else if (eventType === 'result') {
            result = data;
          } else if (eventType === 'error') {
            throw new Error(data.error);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!result) {
    throw new Error('No result received from server.');
  }

  // The result from the backend is already normalized, so we can return it directly
  // But ensure all required fields are present with fallback values
  return {
    atsScore: result.atsScore ?? 50,
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
    missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
    improvements: Array.isArray(result.improvements) ? result.improvements : [],
    recommendedRoles: Array.isArray(result.recommendedRoles) ? result.recommendedRoles : [],
    summary: result.summary ?? 'Resume analyzed successfully.',
    tailoredResume: result.tailoredResume ?? resumeText,
  };
}
