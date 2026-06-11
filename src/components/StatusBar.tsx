interface StatusBarProps {
  lastAction: string;
  elementCount: number;
}

export function StatusBar({ lastAction, elementCount }: StatusBarProps) {
  return (
    <div style={{
      padding: '8px 16px',
      background: '#16213e',
      borderRadius: 6,
      fontSize: 13,
      color: '#aaa',
      display: 'flex',
      gap: 24,
    }}>
      <span>最后操作: {lastAction || '无'}</span>
      <span>画布元素: {elementCount} 个</span>
    </div>
  );
}
