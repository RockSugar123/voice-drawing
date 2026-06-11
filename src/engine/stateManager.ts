import type { CanvasElement, CanvasSnapshot } from './operations';

interface StateEntry {
  elements: CanvasElement[];
}

export class StateManager {
  private undoStack: StateEntry[] = [];
  private redoStack: StateEntry[] = [];
  private elements: CanvasElement[] = [];
  private idCounter = 0;

  getElements(): CanvasElement[] {
    return this.elements;
  }

  nextId(): string {
    this.idCounter++;
    return `e${this.idCounter}`;
  }

  addElement(el: CanvasElement): void {
    this.pushUndo();
    this.elements.push(el);
    this.redoStack = [];
  }

  removeElement(id: string): CanvasElement | undefined {
    const idx = this.elements.findIndex(e => e.id === id);
    if (idx === -1) return undefined;
    this.pushUndo();
    const [removed] = this.elements.splice(idx, 1);
    this.redoStack = [];
    return removed;
  }

  updateElement(id: string, patch: Partial<CanvasElement>): CanvasElement | undefined {
    const el = this.elements.find(e => e.id === id);
    if (!el) return undefined;
    this.pushUndo();
    Object.assign(el, patch);
    this.redoStack = [];
    return el;
  }

  clearAll(): void {
    this.pushUndo();
    this.elements = [];
    this.redoStack = [];
  }

  undo(): boolean {
    if (this.undoStack.length === 0) return false;
    this.redoStack.push({ elements: [...this.elements] });
    const prev = this.undoStack.pop()!;
    this.elements = prev.elements;
    return true;
  }

  redo(): boolean {
    if (this.redoStack.length === 0) return false;
    this.undoStack.push({ elements: [...this.elements] });
    const next = this.redoStack.pop()!;
    this.elements = next.elements;
    return true;
  }

  getSnapshot(canvasW: number, canvasH: number, bg: string): CanvasSnapshot {
    return {
      elements: this.elements,
      canvas: { width: canvasW, height: canvasH, bg },
    };
  }

  private pushUndo(): void {
    this.undoStack.push({ elements: [...this.elements] });
  }
}
