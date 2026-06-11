const STT_API_KEY = import.meta.env.VITE_LLM_API_KEY || '';
const STT_BASE_URL = import.meta.env.VITE_LLM_BASE_URL || 'https://api.openai.com/v1';

export async function transcribeWithWhisper(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'zh');

  const response = await fetch(STT_BASE_URL + '/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + STT_API_KEY },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Whisper API error ' + response.status);
  }

  const data = await response.json();
  return data.text || '';
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private lastBlob: Blob | null = null;

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.lastBlob = null;
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      this.lastBlob = new Blob(this.chunks, { type: mimeType });
      this.chunks = [];
    };

    this.mediaRecorder.start();
  }

  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.chunks.length > 0) {
          this.lastBlob = new Blob(this.chunks, { type: 'audio/webm' });
          resolve(this.lastBlob);
        } else {
          reject(new Error('stop timed out with no audio data'));
        }
      }, 3000);

      const checkBlob = () => {
        if (this.lastBlob) {
          clearTimeout(timeout);
          resolve(this.lastBlob);
        } else {
          setTimeout(checkBlob, 50);
        }
      };
      this.mediaRecorder?.stop();
      checkBlob();
    });
  }

  async stopAndRestart(): Promise<Blob> {
    const blob = await this.stop();
    this.stream?.getTracks().forEach(t => t.stop());
    await this.start();
    return blob;
  }

  isActive(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  dispose(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.stream?.getTracks().forEach(t => t.stop());
    this.mediaRecorder = null;
    this.stream = null;
  }
}
