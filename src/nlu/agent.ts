import type { AgentResponse, CanvasSnapshot } from '../engine/operations';
import { buildSystemPrompt, buildUserMessage } from './prompt';

interface ChatMessage {
  role: string;
  text: string;
}

const LLM_API_KEY = import.meta.env.VITE_LLM_API_KEY || '';
const LLM_BASE_URL = import.meta.env.VITE_LLM_BASE_URL || 'https://api.openai.com/v1';
const LLM_MODEL = import.meta.env.VITE_LLM_MODEL || 'gpt-4o';

export class NluAgent {
  private history: ChatMessage[] = [];
  private lastTargetId: string | null = null;
  private systemPrompt: string;

  constructor() {
    this.systemPrompt = buildSystemPrompt();
  }

  async processInstruction(instruction: string, snapshot: CanvasSnapshot): Promise<AgentResponse> {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      {
        role: 'user',
        content: buildUserMessage(instruction, snapshot, this.history) +
          (this.lastTargetId ? '\n\nHint: the element ID from the last operation is "' + this.lastTargetId + '". If user says "it"/"这个"/"那个" without other reference, they mean this element.' : ''),
      },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(LLM_BASE_URL + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + LLM_API_KEY,
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages,
          temperature: 0.3,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error('LLM API error ' + response.status + ': ' + errText);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const parsed = JSON.parse(content) as AgentResponse;

      if (!parsed.operations || !Array.isArray(parsed.operations)) {
        return { operations: [], reply: '我没有理解这个指令，换个说法试试？' };
      }

      for (const op of parsed.operations) {
        if (op.op === 'create_shape') {
          op.x = clampCoord(op.x, snapshot.canvas.width);
          op.y = clampCoord(op.y, snapshot.canvas.height);
          if (op.w) op.w = clampSize(op.w);
          if (op.h) op.h = clampSize(op.h);
          if (op.r) op.r = clampSize(op.r);
        }
        if (op.op === 'move') {
          op.dx = clampOffset(op.dx);
          op.dy = clampOffset(op.dy);
        }
      }

      this.history.push({ role: 'user', text: instruction });
      this.history.push({ role: 'assistant', text: parsed.reply });
      if (this.history.length > 20) this.history.splice(0, 2);

      return parsed;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { operations: [], reply: '正在处理上一个指令...' };
      }
      if (err instanceof SyntaxError) {
        try {
          return await this.retryOnce(instruction);
        } catch {
          return { operations: [], reply: '这个指令我没理解，换个说法试试？' };
        }
      }
      return { operations: [], reply: '这个指令我没理解，换个说法试试？' };
    } finally {
      clearTimeout(timeout);
    }
  }

  setLastTargetId(id: string): void {
    this.lastTargetId = id;
  }

  getHistory(): ChatMessage[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
    this.lastTargetId = null;
  }

  private async retryOnce(instruction: string): Promise<AgentResponse> {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: 'User instruction: "' + instruction + '"\n\nReturn valid JSON only, no other text.' },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(LLM_BASE_URL + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + LLM_API_KEY,
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages,
          temperature: 0.1,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      return JSON.parse(content) as AgentResponse;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function clampCoord(v: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(v)));
}

function clampSize(v: number): number {
  return Math.max(10, Math.min(600, Math.round(v)));
}

function clampOffset(v: number): number {
  return Math.max(-300, Math.min(300, Math.round(v)));
}
