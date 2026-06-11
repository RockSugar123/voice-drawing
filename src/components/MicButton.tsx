interface MicButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
}

export function MicButton({ isListening, isProcessing, onClick }: MicButtonProps) {
  const color = isProcessing ? '#FFD700' : isListening ? '#FF4444' : '#44CC44';
  const label = isProcessing ? '处理中...' : isListening ? '停止' : '开始说话';

  return (
    <button
      onClick={onClick}
      disabled={isProcessing}
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        border: '3px solid ' + color,
        background: isListening ? 'rgba(255,68,68,0.15)' : 'rgba(68,204,68,0.1)',
        color,
        fontSize: 14,
        cursor: isProcessing ? 'wait' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  );
}
