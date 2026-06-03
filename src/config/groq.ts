import axios from 'axios';
import { logger } from '../utils/logger';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const callGroq = async (messages: GroqMessage[], model?: string): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY;
  const selectedModel = model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  try {
    const response = await axios.post<GroqResponse>(
      GROQ_API_URL,
      {
        model: selectedModel,
        messages,
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) throw new Error('Groq returned an empty response');

    logger.info(
      {
        model: selectedModel,
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
      },
      'Groq call successful'
    );

    return content;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;
      logger.error({ status, error: message }, 'Groq request failed');
      throw new Error(`Groq API error (${status}): ${message}`);
    }
    throw error;
  }
};
