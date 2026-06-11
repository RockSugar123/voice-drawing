import { useRef, useEffect } from 'react';
import { CanvasEngine } from '../engine/canvasEngine';

interface CanvasProps {
  engineRef: React.MutableRefObject<CanvasEngine | null>;
  onEngineReady?: (engine: CanvasEngine) => void;
}

const CANVAS_W = 800;
const CANVAS_H = 600;

export function DrawingCanvas({ engineRef, onEngineReady }: CanvasProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasElRef.current) return;
    const engine = new CanvasEngine(canvasElRef.current, CANVAS_W, CANVAS_H);
    engineRef.current = engine;
    onEngineReady?.(engine);
    return () => { engine.dispose(); };
  }, []);

  return (
    <div style={{
      border: '2px solid #334',
      borderRadius: 8,
      overflow: 'hidden',
      display: 'inline-block',
      background: '#fff',
    }}>
      <canvas ref={canvasElRef} />
    </div>
  );
}
