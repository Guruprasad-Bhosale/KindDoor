'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Volume2, Eye, Heart, Shield, Check, Save } from 'lucide-react';

interface AccessibilitySettingsViewProps {
  resident: any;
  isLoading: boolean;
  onSave: (updates: any) => Promise<void>;
  showToast: (msg: string) => void;
}

export const AccessibilitySettingsView: React.FC<AccessibilitySettingsViewProps> = ({
  resident,
  isLoading,
  onSave,
  showToast
}) => {
  const [mode, setMode] = useState('STANDARD');
  const [handsFreeEntryEnabled, setHandsFreeEntryEnabled] = useState(true);
  const [spokenFeedbackEnabled, setSpokenFeedbackEnabled] = useState(true);
  const [visualAlertsEnabled, setVisualAlertsEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [binaryChoicesOnly, setBinaryChoicesOnly] = useState(false);
  const [largeText, setLargeText] = useState(false);

  useEffect(() => {
    if (resident?.accessibility) {
      setMode(resident.accessibility.mode || 'STANDARD');
      setSpokenFeedbackEnabled(resident.accessibility.spokenFeedbackEnabled ?? true);
      setVisualAlertsEnabled(resident.accessibility.visualAlertsEnabled ?? true);
      setHighContrast(resident.accessibility.highContrast ?? false);
      setSpeechRate(resident.accessibility.speechRate ?? 1.0);
      setSpeechPitch(resident.accessibility.speechPitch ?? 1.0);
      setBinaryChoicesOnly(resident.accessibility.binaryChoicesOnly ?? false);
      setLargeText(resident.accessibility.largeText ?? false);
    }
    if (resident) {
      setHandsFreeEntryEnabled(resident.handsFreeEntryEnabled ?? true);
    }
  }, [resident]);

  const handleSave = async () => {
    await onSave({
      mode,
      handsFreeEntryEnabled,
      spokenFeedbackEnabled,
      visualAlertsEnabled,
      highContrast,
      speechRate,
      speechPitch,
      binaryChoicesOnly,
      largeText
    });
    showToast('Accessibility & Entry Preferences Saved!');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Accessibility & Adaptation Preferences</h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure voice synthesis, visual cues, cognitive simplification, and hands-free policy settings.
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selection Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Primary Interaction Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModeCard
            title="Standard Mode"
            description="Balanced multimodal experience with voice & visual elements."
            active={mode === 'STANDARD'}
            onClick={() => {
              setMode('STANDARD');
              setSpokenFeedbackEnabled(true);
              setVisualAlertsEnabled(true);
              setBinaryChoicesOnly(false);
            }}
          />
          <ModeCard
            title="Blind / Low-Vision"
            description="Voice-first announcements, high keyboard focus, instant audio replay."
            active={mode === 'BLIND_LOW_VISION'}
            onClick={() => {
              setMode('BLIND_LOW_VISION');
              setSpokenFeedbackEnabled(true);
              setVisualAlertsEnabled(false);
            }}
          />
          <ModeCard
            title="Deaf / Hard-of-Hearing"
            description="Zero-audio requirement, prominent visual alert banners, live captions."
            active={mode === 'DEAF_HARD_OF_HEARING'}
            onClick={() => {
              setMode('DEAF_HARD_OF_HEARING');
              setSpokenFeedbackEnabled(false);
              setVisualAlertsEnabled(true);
            }}
          />
          <ModeCard
            title="Patient / Simplified"
            description="Simplified 2-choice max options, patient repetition, calm pacing."
            active={mode === 'PATIENT_SIMPLIFIED'}
            onClick={() => {
              setMode('PATIENT_SIMPLIFIED');
              setBinaryChoicesOnly(true);
              setSpeechRate(0.85);
            }}
          />
        </div>
      </div>

      {/* Voice & Speech Synthesis Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Volume2 className="w-5 h-5 text-amber-400" />
          <span>Web Speech Synthesis Parameters</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="rate-slider" className="text-slate-300 font-medium">Speech Rate ({speechRate}x)</label>
              <span className="text-slate-500">0.5x - 2.0x</span>
            </div>
            <input
              id="rate-slider"
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="pitch-slider" className="text-slate-300 font-medium">Speech Pitch ({speechPitch})</label>
              <span className="text-slate-500">0.5 - 1.5</span>
            </div>
            <input
              id="pitch-slider"
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={speechPitch}
              onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Toggles Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Visual, Cognitive & Security Toggles</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ToggleItem
            label="Hands-Free Auto-Unlock"
            description="Automatically unlock when approaching with verified BLE beacon."
            checked={handsFreeEntryEnabled}
            onChange={setHandsFreeEntryEnabled}
          />
          <ToggleItem
            label="Spoken Audio Feedback"
            description="Synthesize browser voice announcements for doorbell events."
            checked={spokenFeedbackEnabled}
            onChange={setSpokenFeedbackEnabled}
          />
          <ToggleItem
            label="Visual Alert Flash"
            description="Flash screen border with high-contrast amber indicator upon arrival."
            checked={visualAlertsEnabled}
            onChange={setVisualAlertsEnabled}
          />
          <ToggleItem
            label="Large Text & High Contrast"
            description="Increase transcript font size to 24px for maximum readability."
            checked={largeText}
            onChange={setLargeText}
          />
          <ToggleItem
            label="Strict Binary Choices"
            description="Restrict all assistant prompts to 2 simplified options (A / B)."
            checked={binaryChoicesOnly}
            onChange={setBinaryChoicesOnly}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center space-x-2 shadow-lg transition"
        >
          <Save className="w-5 h-5" />
          <span>Save Preferences</span>
        </button>
      </div>
    </div>
  );
};

const ModeCard = ({
  title,
  description,
  active,
  onClick
}: {
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-xl border cursor-pointer transition ${
      active
        ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
    }`}
  >
    <div className="flex items-center justify-between mb-1">
      <span className="font-bold text-sm">{title}</span>
      {active && <Check className="w-4 h-4 text-amber-400" />}
    </div>
    <p className="text-xs text-slate-400">{description}</p>
  </div>
);

const ToggleItem = ({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between space-x-3">
    <div>
      <div className="font-semibold text-xs text-white">{label}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{description}</div>
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 flex items-center rounded-full p-1 transition shrink-0 ${
        checked ? 'bg-amber-500' : 'bg-slate-800'
      }`}
    >
      <div
        className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);
