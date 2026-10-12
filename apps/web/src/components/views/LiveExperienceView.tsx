'use client';

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  RotateCcw,
  Send,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Shield,
  Eye,
  MessageSquare,
  Lock,
  Unlock,
  Radio,
  UserCheck
} from 'lucide-react';

interface LiveExperienceViewProps {
  resident: any;
  lockStatus: any;
  lastInteraction: any;
  isLoading: boolean;
  speech: any;
  onSendMessage: (msg: string) => void;
  onConsentEnroll: () => void;
}

export const LiveExperienceView: React.FC<LiveExperienceViewProps> = ({
  resident,
  lockStatus,
  lastInteraction,
  isLoading,
  speech,
  onSendMessage,
  onConsentEnroll
}) => {
  const [inputText, setInputText] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);

  const mode = resident?.accessibility?.mode || 'STANDARD';
  const isBlindMode = mode === 'BLIND_LOW_VISION';
  const isDeafMode = mode === 'DEAF_HARD_OF_HEARING';
  const isPatientMode = mode === 'PATIENT_SIMPLIFIED';

  // Global Keyboard Shortcuts (WCAG 2.2 AA accessibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is actively typing in input, don't trigger hotkeys
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // Spacebar -> Replay Speech
      if (e.code === 'Space') {
        e.preventDefault();
        speech.repeat();
      }

      // '1' or '2' -> Select simplified choices if available
      if (lastInteraction?.simplifiedChoices) {
        if (e.key === '1' && lastInteraction.simplifiedChoices[0]) {
          onSendMessage(lastInteraction.simplifiedChoices[0]);
        } else if (e.key === '2' && lastInteraction.simplifiedChoices[1]) {
          onSendMessage(lastInteraction.simplifiedChoices[1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastInteraction, onSendMessage, speech]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Visual Alert Banner for Deaf/Hard-of-Hearing Mode */}
      {isDeafMode && (
        <div className="bg-amber-950/60 border-2 border-amber-500 rounded-2xl p-5 shadow-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3 text-amber-300">
            <Eye className="w-7 h-7 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-lg text-white">Visual-First Door Notification Active</div>
              <div className="text-xs text-amber-200">
                Audio is muted; all visitor dialogue, transcriptions, and options are rendered below in high-contrast text.
              </div>
            </div>
          </div>
          <span className="text-xs font-mono bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-full uppercase">
            Visual Priority
          </span>
        </div>
      )}

      {/* Main Live Intercom Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-ping" />
            <h2 className="text-lg font-bold text-white">Live Entrance Intercom & Assistant</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              {mode.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => speech.repeat()}
              disabled={speech.isSpeaking}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium rounded-lg border border-slate-700 transition"
              title="Repeat spoken text (Spacebar)"
            >
              <Volume2 className={`w-4 h-4 ${speech.isSpeaking ? 'animate-bounce' : ''}`} />
              <span>Repeat Audio [Space]</span>
            </button>

            {speech.isSpeaking && (
              <button
                onClick={() => speech.stop()}
                className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-400 text-xs font-medium rounded-lg border border-red-800 transition"
              >
                Mute
              </button>
            )}
          </div>
        </div>

        {/* Current Dialogue / Notification Display */}
        <div className="space-y-4">
          {/* Visual Alert Text Card */}
          <div
            className={`p-5 rounded-xl border transition-all ${
              lastInteraction?.visualAlertText
                ? 'bg-slate-950 border-amber-500/40 text-slate-100'
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>KindDoor Speech & Visual Transcript</span>
              </span>
              <span className="text-[10px] text-slate-500">
                {lastInteraction?.usedBedrock ? 'Amazon Bedrock Converse API' : 'Deterministic Assistant'}
              </span>
            </div>

            <p
              className={`leading-relaxed ${
                resident?.accessibility?.largeText ? 'text-2xl font-semibold' : 'text-lg font-medium'
              } text-white`}
              role="alert"
              aria-live="assertive"
            >
              {lastInteraction?.response ||
                'KindDoor is standing by. Trigger a scenario or speak to begin.'}
            </p>
          </div>

          {/* Simplified Binary / Multi-Choice Buttons (Scenario D & General Accessibility) */}
          {lastInteraction?.simplifiedChoices && lastInteraction.simplifiedChoices.length > 0 && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Your Response (Press key 1 or 2):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lastInteraction.simplifiedChoices.map((choice: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(choice)}
                    className="p-4 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-base rounded-xl border border-slate-700 text-left flex items-center justify-between transition group shadow"
                  >
                    <span className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 group-hover:bg-slate-950 group-hover:text-amber-400 flex items-center justify-center text-xs font-mono font-bold">
                        {idx + 1}
                      </span>
                      <span>{choice}</span>
                    </span>
                    <Check className="w-5 h-5 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Consent-Gated Enrollment Card (Scenario E) */}
          {lastInteraction?.response?.includes('enroll John') && (
            <div className="p-5 bg-amber-950/40 border border-amber-500/50 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <Shield className="w-4 h-4" />
                <span>Explicit Resident Consent Gate Required</span>
              </div>
              <p className="text-xs text-slate-300">
                Permanent visitor profiles can NEVER be created automatically by AI reasoning. You must explicitly give consent to enroll John into your trusted visitor directory.
              </p>
              <label className="flex items-center space-x-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-400"
                />
                <span className="text-xs text-white font-medium">
                  I give explicit permission to store John in my regular visitor directory
                </span>
              </label>
              <button
                disabled={!consentChecked}
                onClick={onConsentEnroll}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs rounded-lg transition"
              >
                Complete Consent-Gated Enrollment
              </button>
            </div>
          )}
        </div>

        {/* Resident Interactive Message Bar */}
        <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Speak or type a question (e.g. 'Who is at the door?', 'I don't understand')..."
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-sm rounded-xl px-4 py-3 outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-xl flex items-center space-x-2 transition"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Real MCP Tool Invocations Drawer */}
      {lastInteraction?.toolsExecuted && lastInteraction.toolsExecuted.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <Radio className="w-3.5 h-3.5 text-green-400" />
              <span>Real MCP Tool Execution Trail ({lastInteraction.toolsExecuted.length} tools called)</span>
            </span>
            <span className="font-mono text-[10px]">Streamable HTTP Protocol 2025-11-25</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {lastInteraction.toolsExecuted.map((t: any, idx: number) => (
              <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400">{t.toolName}</span>
                  <span className="text-[10px] text-slate-500">{t.durationMs}ms</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Args: {JSON.stringify(t.args)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
