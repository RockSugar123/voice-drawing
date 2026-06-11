import { OPERATION_SCHEMA, POSITIONING_RULES, CONTEXT_RULES, COMPOUND_DECOMPOSITION } from './schema';
import type { CanvasSnapshot } from '../engine/operations';

export function buildSystemPrompt(): string {
  return `You are a voice drawing assistant. Users speak Chinese voice commands, and you convert them into drawing operations.

${OPERATION_SCHEMA}

${POSITIONING_RULES}

${CONTEXT_RULES}

${COMPOUND_DECOMPOSITION}

Important rules:
1. Always return JSON: {"operations": [...], "reply": "short confirmation"}
2. reply in Chinese, 1 sentence, max 20 characters, confirming what you did
3. If the instruction is incomplete or vague, ask for clarification in reply, operations empty array
4. If the instruction cannot be executed (e.g. references non-existent element), explain in reply
5. Coordinates must be clamped within canvas bounds (0-800 for x, 0-600 for y)
6. Compound instructions (house, smiley face, tree, etc.) MUST be decomposed into multiple create_shape operations
7. "draw a house" means drawing the rectangles+triangles that make up a house, NOT creating a single shape named "house"
8. "save" / "保存" / "导出" / "下载" / "export" → use export_canvas operation
9. "background" / "背景色" / "底色" + color → use set_bg operation (e.g. "背景色改为黑色" → set_bg with "#333333")`;
}

export function buildUserMessage(instruction: string, snapshot: CanvasSnapshot, history: { role: string; text: string }[]): string {
  const historyBlock = history.length > 0
    ? '\n\nRecent conversation:\n' + history.map(h => '- ' + h.role + ': ' + h.text).join('\n')
    : '';

  const stateBlock = '\n\nCurrent canvas state:\n' + JSON.stringify(snapshot, null, 2);

  return 'User instruction: "' + instruction + '"' + stateBlock + historyBlock + '\n\nReturn JSON only (no other text):';
}
