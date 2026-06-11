import type { SpeechResult, SpeechOptions } from './types';

export class SpeechRecognizer {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private options: SpeechOptions;
  private lowConfCount = 0;

  constructor(options: SpeechOptions = {}) {
    this.options = {
      lang: 'zh-CN',
      continuous: true,
      ...options,
    };
  }

  start(): void {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      this.options.onError?.('Browser does not support speech recognition');
      return;
    }

    this.recognition = new SR();
    this.recognition.lang = this.options.lang || 'zh-CN';
    this.recognition.continuous = this.options.continuous ?? true;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      const text = last[0].transcript;
      const confidence = last[0].confidence;

      if (last.isFinal) {
        if (confidence < 0.7) {
          this.lowConfCount++;
        } else {
          this.lowConfCount = 0;
        }
        this.options.onResult?.({ text, confidence, isFinal: true });
      }
    };

    this.recognition.onerror = (event: Event) => {
      const err = event as SpeechRecognitionErrorEvent;
      this.options.onError?.(err.error || 'Speech recognition error');
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        try { this.recognition?.start(); } catch { /* ignore */ }
      }
    };

    this.recognition.start();
    this.isListening = true;
    this.options.onStateChange?.(true);
  }

  stop(): void {
    this.isListening = false;
    this.recognition?.stop();
    this.options.onStateChange?.(false);
  }

  getLowConfCount(): number {
    return this.lowConfCount;
  }

  resetLowConfCount(): void {
    this.lowConfCount = 0;
  }

  isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}
