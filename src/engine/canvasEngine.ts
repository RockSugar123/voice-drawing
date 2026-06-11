import { Canvas, Circle, Rect, Triangle, Ellipse, Polyline, type FabricObject } from 'fabric';
import type { DrawOperation, CanvasElement } from './operations';
import { StateManager } from './stateManager';

export class CanvasEngine {
  private fabric: Canvas;
  private state: StateManager;
  private canvasW: number;
  private canvasH: number;

  constructor(canvasEl: HTMLCanvasElement, width: number, height: number) {
    this.canvasW = width;
    this.canvasH = height;
    this.fabric = new Canvas(canvasEl, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: false,
    });
    this.state = new StateManager();
  }

  getState(): StateManager {
    return this.state;
  }

  getCanvas(): Canvas {
    return this.fabric;
  }

  async execute(op: DrawOperation): Promise<string | null> {
    switch (op.op) {
      case 'create_shape': return this.createShape(op);
      case 'create_line': return this.createLine(op);
      case 'freehand': return this.createFreehand(op);
      case 'move': return this.moveElement(op);
      case 'resize': return this.resizeElement(op);
      case 'delete': return this.deleteElement(op);
      case 'recolor': return this.recolorElement(op);
      case 'clear': return this.clearCanvas();
      case 'undo': return this.undo();
      case 'redo': return this.redo();
      case 'export_canvas': return this.exportCanvas();
      case 'set_bg': return this.setBg(op);
      default: return null;
    }
  }

  async executeAll(operations: DrawOperation[], onEach?: (desc: string) => void): Promise<void> {
    for (const op of operations) {
      const desc = await this.execute(op);
      if (desc && onEach) onEach(desc);
      await sleep(150);
    }
    this.fabric.renderAll();
  }

  private createShape(op: Extract<DrawOperation, { op: 'create_shape' }>): string {
    const id = this.state.nextId();
    const x = clamp(op.x, 0, this.canvasW);
    const y = clamp(op.y, 0, this.canvasH);
    const color = op.color || '#333333';
    const fill = op.fill !== false ? color : 'transparent';

    let obj: FabricObject;

    switch (op.type) {
      case 'circle': {
        const r = op.r || 50;
        obj = new Circle({ left: x, top: y, radius: r, fill, stroke: color, strokeWidth: 2, originX: 'center', originY: 'center' });
        break;
      }
      case 'rect': {
        const w = op.w || 100;
        const h = op.h || 80;
        obj = new Rect({ left: x, top: y, width: w, height: h, fill, stroke: color, strokeWidth: 2, originX: 'center', originY: 'center' });
        break;
      }
      case 'triangle': {
        const w = op.w || 100;
        const h = op.h || 80;
        obj = new Triangle({ left: x, top: y, width: w, height: h, fill, stroke: color, strokeWidth: 2, originX: 'center', originY: 'center' });
        break;
      }
      case 'ellipse': {
        const rx = (op.w || 120) / 2;
        const ry = (op.h || 80) / 2;
        obj = new Ellipse({ left: x, top: y, rx, ry, fill, stroke: color, strokeWidth: 2, originX: 'center', originY: 'center' });
        break;
      }
      default:
        return "Unknown shape: " + op.type;
    }

    (obj as any).customId = id;
    this.fabric.add(obj);
    this.state.addElement(fabricToElement(id, op.type, x, y, op.w, op.h, op.r, color, fill !== 'transparent', undefined));
    this.highlight(obj);
    return "Drew " + op.type;
  }

  private createLine(op: Extract<DrawOperation, { op: 'create_line' }>): string {
    const id = this.state.nextId();
    const flat = op.points.flatMap(p => ({ x: clamp(p.x, 0, this.canvasW), y: clamp(p.y, 0, this.canvasH) }));
    const polyline = new Polyline(flat, {
      stroke: op.color || '#333',
      strokeWidth: op.width || 3,
      fill: 'transparent',
      objectCaching: false,
    });
    (polyline as any).customId = id;
    this.fabric.add(polyline);
    const bounds = polyline.getBoundingRect();
    this.state.addElement({ id, type: 'line', left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height, fill: 'transparent', stroke: op.color || '#333', strokeWidth: op.width || 3, points: op.points });
    this.highlight(polyline);
    return "Drew a line";
  }

  private createFreehand(op: Extract<DrawOperation, { op: 'freehand' }>): string {
    return this.createLine(op as unknown as Extract<DrawOperation, { op: 'create_line' }>);
  }

  private moveElement(op: Extract<DrawOperation, { op: 'move' }>): string {
    const obj = this.findById(op.target_id);
    if (!obj) return "Element not found: " + op.target_id;
    obj.set({ left: clamp((obj.left || 0) + op.dx, 0, this.canvasW), top: clamp((obj.top || 0) + op.dy, 0, this.canvasH) });
    this.state.updateElement(op.target_id, { left: obj.left!, top: obj.top! });
    this.highlight(obj);
    return "Moved element";
  }

  private resizeElement(op: Extract<DrawOperation, { op: 'resize' }>): string {
    const obj = this.findById(op.target_id);
    if (!obj) return "Element not found: " + op.target_id;
    obj.set({ scaleX: (obj.scaleX || 1) * op.scale_x, scaleY: (obj.scaleY || 1) * op.scale_y });
    this.highlight(obj);
    return "Resized element";
  }

  private deleteElement(op: Extract<DrawOperation, { op: 'delete' }>): string {
    const obj = this.findById(op.target_id);
    if (!obj) return "Element not found: " + op.target_id;
    this.fabric.remove(obj);
    this.state.removeElement(op.target_id);
    return "Deleted element";
  }

  private recolorElement(op: Extract<DrawOperation, { op: 'recolor' }>): string {
    const obj = this.findById(op.target_id);
    if (!obj) return "Element not found: " + op.target_id;
    const el = this.state.getElements().find(e => e.id === op.target_id);
    const wasFilled = el?.fill !== 'transparent';
    if (wasFilled) obj.set({ fill: op.color });
    obj.set({ stroke: op.color });
    this.state.updateElement(op.target_id, { fill: wasFilled ? op.color : 'transparent', stroke: op.color });
    this.highlight(obj);
    return "Changed color";
  }

  private clearCanvas(): string {
    this.fabric.clear();
    this.fabric.backgroundColor = '#ffffff';
    this.state.clearAll();
    return "Cleared canvas";
  }

  private undo(): string {
    const ok = this.state.undo();
    if (!ok) return "Nothing to undo";
    this.rebuildCanvas();
    return "Undone";
  }

  private redo(): string {
    const ok = this.state.redo();
    if (!ok) return "Nothing to redo";
    this.rebuildCanvas();
    return "Redone";
  }

  private exportCanvas(): string {
    const dataUrl = this.fabric.toDataURL({ format: 'png', multiplier: 2 });
    const link = document.createElement('a');
    link.download = 'drawing-' + Date.now() + '.png';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return "Exported image";
  }

  private setBg(op: Extract<DrawOperation, { op: 'set_bg' }>): string {
    this.fabric.backgroundColor = op.color;
    this.fabric.renderAll();
    return "Changed background";
  }

  private rebuildCanvas(): void {
    this.fabric.clear();
    this.fabric.backgroundColor = '#ffffff';
    for (const el of this.state.getElements()) {
      const obj = elementToFabric(el);
      if (obj) this.fabric.add(obj);
    }
    this.fabric.renderAll();
  }

  private findById(id: string): FabricObject | undefined {
    const objs = this.fabric.getObjects();
    return objs.find(o => (o as any).customId === id);
  }

  private highlight(obj: FabricObject): void {
    const origStroke = obj.stroke;
    const origWidth = obj.strokeWidth;
    obj.set({ stroke: '#FFD700', strokeWidth: 3 });
    this.fabric.renderAll();
    setTimeout(() => {
      obj.set({ stroke: origStroke, strokeWidth: origWidth });
      this.fabric.renderAll();
    }, 600);
  }

  dispose(): void {
    this.fabric.dispose();
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function fabricToElement(id: string, type: string, x: number, y: number, w?: number, h?: number, r?: number, color?: string, fill?: boolean, points?: { x: number; y: number }[]): CanvasElement {
  return {
    id,
    type: type as CanvasElement['type'],
    left: x,
    top: y,
    width: w || (r ? r * 2 : 100),
    height: h || (r ? r * 2 : 80),
    radius: r,
    fill: fill ? (color || '#333') : 'transparent',
    stroke: color || '#333',
    strokeWidth: 2,
    points,
  };
}

function elementToFabric(el: CanvasElement): FabricObject | null {
  const base = { left: el.left, top: el.top, fill: el.fill, stroke: el.stroke, strokeWidth: el.strokeWidth, originX: 'center' as const, originY: 'center' as const };
  let obj: FabricObject;
  switch (el.type) {
    case 'circle': obj = new Circle({ ...base, radius: el.radius || 50 }); break;
    case 'rect': obj = new Rect({ ...base, width: el.width, height: el.height }); break;
    case 'triangle': obj = new Triangle({ ...base, width: el.width, height: el.height }); break;
    case 'ellipse': obj = new Ellipse({ ...base, rx: el.width / 2, ry: el.height / 2 }); break;
    case 'line':
    case 'freehand': {
      if (!el.points) return null;
      obj = new Polyline(el.points.flatMap(p => ({ x: p.x, y: p.y })), { stroke: el.stroke, strokeWidth: el.strokeWidth, fill: 'transparent', objectCaching: false });
      break;
    }
    default: return null;
  }
  (obj as any).customId = el.id;
  return obj;
}
