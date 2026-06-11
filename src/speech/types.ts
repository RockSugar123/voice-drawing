export interface SpeechResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechOptions {
  lang?: string;
  continuous?: boolean;
  onResult?: (result: SpeechResult) => void;
  onError?: (error: string) => void;
  onStateChange?: (listening: boolean) => void;
}
