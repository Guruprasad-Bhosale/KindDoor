'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpeechSettings {
  enabled: boolean;
  rate: number;
  pitch: number;
}

export function useSpeech(initialSettings: SpeechSettings = { enabled: true, rate: 1.0, pitch: 1.0 }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState<string>('');
  const [settings, setSettings] = useState<SpeechSettings>(initialSettings);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback(
    (text: string, customSettings?: Partial<SpeechSettings>) => {
      if (!synthRef.current || !settings.enabled || !text) return;

      synthRef.current.cancel(); // Cancel any ongoing speech
      setLastSpokenText(text);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = customSettings?.rate ?? settings.rate;
      utterance.pitch = customSettings?.pitch ?? settings.pitch;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    },
    [settings]
  );

  const repeat = useCallback(() => {
    if (lastSpokenText) {
      speak(lastSpokenText);
    }
  }, [lastSpokenText, speak]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    speak,
    repeat,
    stop,
    isSpeaking,
    lastSpokenText,
    settings,
    setSettings
  };
}
