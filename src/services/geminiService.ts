import type { ResumeAnalysis } from '@/src/types/resume';

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

  return (await response.json()) as ResumeAnalysis;
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

  return result;
}
