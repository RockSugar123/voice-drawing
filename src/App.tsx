import { useRef, useState, useCallback, useEffect } from 'react';
import { DrawingCanvas } from './components/Canvas';
import { MicButton } from './components/MicButton';
import { StatusBar } from './components/StatusBar';
import { CommandLog } from './components/CommandLog';
import { CanvasEngine } from './engine/canvasEngine';
import { NluAgent } from './nlu/agent';
import { SpeechRecognizer } from './speech/speechRecognition';
import { AudioRecorder, transcribeWithWhisper } from './speech/cloudStt';
import { speak, speakError } from './feedback/tts';
import type { AgentResponse } from './engine/operations';

interface LogEntry {
  text: string;
  reply: string;
  time: number;
}

export default function App() {
  const engineRef = useRef<CanvasEngine | null>(null);
  const nluRef = useRef<NluAgent>(new NluAgent());
  const speechRef = useRef<SpeechRecognizer | null>(null);
  const audioRecRef = useRef<AudioRecorder | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState('');
  const [elementCount, setElementCount] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [statusMsg, setStatusMsg] = useState('点击麦克风按钮开始');

  const updateStatus = useCallback(() => {
    if (!engineRef.current) return;
    const state = engineRef.current.getState();
    setElementCount(state.getElements().length);
  }, []);

  const handleSpeechResult = useCallback(async (result: { text: string; confidence: number }) => {
    if (!engineRef.current) return;

    setIsProcessing(true);

    let finalText = result.text;

    // Cloud STT fallback on low confidence
    if (result.confidence < 0.7 && audioRecRef.current?.isActive()) {
      setStatusMsg('云端重识别中...');
      try {
        const blob = await audioRecRef.current.stopAndRestart();
        const cloudText = await transcribeWithWhisper(blob);
        if (cloudText.trim()) {
          finalText = cloudText;
        }
      } catch {
        // Fall through with Web Speech text
      }
    }

    setStatusMsg('AI 理解中...');

    const snapshot = engineRef.current.getState().getSnapshot(800, 600, '#ffffff');
    const response: AgentResponse = await nluRef.current.processInstruction(finalText, snapshot);
    const { operations, reply } = response;

    if (operations.length === 0) {
      speak(reply);
      setLog(prev => [...prev, { text: finalText, reply, time: Date.now() }]);
      setStatusMsg(reply);
      setIsProcessing(false);
      return;
    }

    for (const op of operations) {
      const desc = await engineRef.current.execute(op);
      if (desc) setLastAction(desc);
    }
    updateStatus();

    if (operations.length > 0) {
      const lastOp = operations[operations.length - 1];
      if (lastOp.op === 'create_shape' || lastOp.op === 'create_line' || lastOp.op === 'freehand') {
        const elements = engineRef.current.getState().getElements();
        if (elements.length > 0) {
          nluRef.current.setLastTargetId(elements[elements.length - 1].id);
        }
      }
    }

    speak(reply);
    setLog(prev => [...prev, { text: finalText, reply, time: Date.now() }]);
    setStatusMsg(reply);
    setIsProcessing(false);
  }, [updateStatus]);

  const toggleMic = useCallback(() => {
    if (isListening) {
      speechRef.current?.stop();
      audioRecRef.current?.dispose();
      audioRecRef.current = null;
      setIsListening(false);
      setStatusMsg('已停止监听');
      return;
    }

    if (!speechRef.current) {
      speechRef.current = new SpeechRecognizer({
        lang: 'zh-CN',
        continuous: true,
        onResult: (result) => {
          if (result.isFinal && result.text.trim()) {
            handleSpeechResult({ text: result.text.trim(), confidence: result.confidence });
          }
        },
        onError: (err) => {
          setStatusMsg('语音识别错误: ' + err);
          speakError('语音识别出错，请重试');
        },
        onStateChange: (listening) => {
          setIsListening(listening);
        },
      });
    }

    speechRef.current.start();
    audioRecRef.current = new AudioRecorder();
    audioRecRef.current.start().catch(() => {
      // Audio recorder is optional — cloud STT won't work but speech will
    });
    setIsListening(true);
    setStatusMsg('正在听...');
  }, [isListening, handleSpeechResult]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        toggleMic();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleMic]);

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 20, color: '#FFD700', marginBottom: 4 }}>AI 语音绘图工具</h1>
        <DrawingCanvas engineRef={engineRef} onEngineReady={() => updateStatus()} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <MicButton isListening={isListening} isProcessing={isProcessing} onClick={toggleMic} />
          <span style={{ fontSize: 13, color: '#888', maxWidth: 200 }}>{statusMsg}</span>
        </div>
        <StatusBar lastAction={lastAction} elementCount={elementCount} />
      </div>
      <CommandLog entries={log} />
    </div>
  );
}
