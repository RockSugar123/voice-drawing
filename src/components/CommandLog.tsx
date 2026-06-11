interface CommandLogProps {
  entries: { text: string; reply: string; time: number }[];
}

export function CommandLog({ entries }: CommandLogProps) {
  return (
    <div style={{
      width: 260,
      maxHeight: 600,
      overflowY: 'auto',
      padding: 12,
      background: '#16213e',
      borderRadius: 8,
      fontSize: 13,
    }}>
      <h3 style={{ margin: '0 0 8px', color: '#FFD700', fontSize: 14 }}>指令历史</h3>
      {entries.length === 0 && <div style={{ color: '#666' }}>等待语音指令...</div>}
      {entries.slice().reverse().map((entry, i) => (
        <div key={i} style={{ marginBottom: 8, padding: '6px 8px', background: '#0f3460', borderRadius: 4 }}>
          <div style={{ color: '#ccc' }}>{entry.text}</div>
          <div style={{ color: '#44CC44', fontSize: 12 }}>OK {entry.reply}</div>
        </div>
      ))}
    </div>
  );
}
