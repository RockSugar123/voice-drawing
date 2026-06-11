interface UndoRedoButtonsProps {
  onUndo: () => void;
  onRedo: () => void;
}

export function UndoRedoButtons({ onUndo, onRedo }: UndoRedoButtonsProps) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={onUndo}
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          border: '2px solid #4488FF',
          background: 'rgba(68,136,255,0.1)',
          color: '#4488FF',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="撤销"
      >&#8630;</button>
      <button
        onClick={onRedo}
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          border: '2px solid #4488FF',
          background: 'rgba(68,136,255,0.1)',
          color: '#4488FF',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="重做"
      >&#8631;</button>
    </div>
  );
}
