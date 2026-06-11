// ---- Element model ----

export interface CanvasElement {
  id: string;
  type: 'circle' | 'rect' | 'triangle' | 'ellipse' | 'line' | 'freehand';
  left: number;
  top: number;
  width: number;
  height: number;
  radius?: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  points?: { x: number; y: number }[];
}

// ---- Draw operations ----

export type DrawOperation =
  | { op: 'create_shape'; type: string; x: number; y: number; w?: number; h?: number; r?: number; color: string; fill?: boolean }
  | { op: 'create_line'; points: { x: number; y: number }[]; color: string; width: number }
  | { op: 'move'; target_id: string; dx: number; dy: number }
  | { op: 'resize'; target_id: string; scale_x: number; scale_y: number }
  | { op: 'delete'; target_id: string }
  | { op: 'recolor'; target_id: string; color: string }
  | { op: 'clear' }
  | { op: 'undo' }
  | { op: 'redo' }
  | { op: 'freehand'; points: { x: number; y: number }[]; color: string; width: number };

// ---- LLM Response ----

export interface AgentResponse {
  operations: DrawOperation[];
  reply: string;
}

// ---- Canvas state snapshot (fed to LLM) ----

export interface CanvasSnapshot {
  elements: CanvasElement[];
  canvas: { width: number; height: number; bg: string };
}

// ---- Grid zones for spatial positioning ----

export const GRID_ZONES: Record<string, { x: number; y: number }> = {
  '左上':    { x: 0.15, y: 0.15 },
  '左上角':  { x: 0.15, y: 0.15 },
  '上':      { x: 0.5,  y: 0.15 },
  '右上':    { x: 0.85, y: 0.15 },
  '右上角':  { x: 0.85, y: 0.15 },
  '左':      { x: 0.15, y: 0.5  },
  '中间':    { x: 0.5,  y: 0.5  },
  '中心':    { x: 0.5,  y: 0.5  },
  '右':      { x: 0.85, y: 0.5  },
  '左下':    { x: 0.15, y: 0.85 },
  '左下角':  { x: 0.15, y: 0.85 },
  '下':      { x: 0.5,  y: 0.85 },
  '底部':    { x: 0.5,  y: 0.85 },
  '右下':    { x: 0.85, y: 0.85 },
  '右下角':  { x: 0.85, y: 0.85 },
};

export function gridToCoord(zone: string, canvasW: number, canvasH: number): { x: number; y: number } {
  const entry = GRID_ZONES[zone];
  if (entry) return { x: entry.x * canvasW, y: entry.y * canvasH };
  return { x: canvasW / 2, y: canvasH / 2 };
}
