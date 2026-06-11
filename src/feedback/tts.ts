export function speak(text: string): void {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 1.1;
  utterance.pitch = 1.0;
  utterance.volume = 0.9;

  utterance.onend = () => { /* Chrome bug workaround */ };

  window.speechSynthesis.speak(utterance);
}

export function speakError(text: string): void {
  speak(text);
}
