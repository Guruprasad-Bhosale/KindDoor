'use client';

import React from 'react';
import {
  Shield,
  Volume2,
  Eye,
  Sparkles,
  Lock,
  Unlock,
  PlayCircle,
  Cpu,
  Radio,
  CheckCircle2,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface HomeViewProps {
  resident: any;
  lockStatus: any;
  mcpStatus: any;
  events: any[];
  onStartScenario: (scenarioId: string) => void;
  onNavigate: (tab: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  resident,
  lockStatus,
  mcpStatus,
  events,
  onStartScenario,
  onNavigate
}) => {
  const isUnlocked = lockStatus?.state === 'UNLOCKED';
  const mode = resident?.accessibility?.mode || 'STANDARD';

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl border border-slate-800 p-6 md:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-medium text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Amazon Developer Hackathon 2026 Prototype</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            The Front Door that Adapts to You.
          </h1>

          <p className="text-slate-300 text-base md:text-lg leading-relaxed">
            KindDoor combines accessibility-first resident profiles, an independent deterministic security policy engine, a self-hosted Model Context Protocol (MCP) server, and Ring integration to deliver frictionless, trustworthy home entry.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('simulator')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg shadow-md transition"
            >
              <PlayCircle className="w-5 h-5" />
              <span>Launch 5-Scenario Interactive Demo</span>
            </button>

            <button
              onClick={() => onNavigate('inspector')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-700 transition"
            >
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Inspect MCP & Bedrock Wire</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Live Status & Integration Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Door & Lock Status Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Simulated Smart Lock
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                Positive State Verification
              </span>
            </div>

            <div className="mt-4 flex items-center space-x-4">
              <div
                className={`p-4 rounded-xl border ${
                  isUnlocked
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {isUnlocked ? <Unlock className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{lockStatus?.state || 'LOCKED'}</div>
                <div className="text-xs text-slate-400">
                  Battery: {lockStatus?.batteryPct || 94}% • Clearly Simulated
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Hands-Free Auto-Entry:</span>
            <span className="font-semibold text-green-400">
              {resident?.handsFreeEntryEnabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        </div>

        {/* Resident Accessibility Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Active Resident Profile
              </span>
              <button
                onClick={() => onNavigate('settings')}
                className="text-xs text-amber-400 hover:underline flex items-center space-x-1"
              >
                <span>Edit Settings</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4 flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg">
                EV
              </div>
              <div>
                <div className="font-bold text-white text-lg">{resident?.name || 'Eleanor Vance'}</div>
                <div className="text-xs text-slate-400">Mode: {mode.replace(/_/g, ' ')}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Voice Announcements:</span>
              <span className="text-slate-200 font-medium">
                {resident?.accessibility?.spokenFeedbackEnabled ? 'Active' : 'Muted'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Visual-First Flash:</span>
              <span className="text-slate-200 font-medium">
                {resident?.accessibility?.visualAlertsEnabled ? 'Active' : 'Off'}
              </span>
            </div>
          </div>
        </div>

        {/* Real System Integration Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                System Integration Matrix
              </span>
              <span className="flex items-center space-x-1 text-xs text-green-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Operational</span>
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300 font-medium">Model Context Protocol (MCP):</span>
                <span className="text-green-400 font-mono">Streamable HTTP (10 tools)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300 font-medium">AI Intelligence:</span>
                <span className="text-amber-400 font-mono">
                  {mcpStatus?.geminiStatus?.isConfigured
                    ? 'Google Gemini Live'
                    : mcpStatus?.bedrockStatus?.isConfigured
                    ? 'AWS Bedrock Live'
                    : 'Deterministic Fallback'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300 font-medium">Ring Ingestion:</span>
                <span className="text-green-400 font-mono">HMAC-SHA256 Validated</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-500">
            Deterministic security policy isolates lock actuation from LLM reasoning.
          </div>
        </div>
      </div>

      {/* Quick Scenario Launch Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Target User Scenarios</h2>
            <p className="text-xs text-slate-400">Click any scenario to simulate end-to-end</p>
          </div>
          <button
            onClick={() => onNavigate('simulator')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center space-x-1"
          >
            <span>Full Simulator Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ScenarioCard
            title="Scenario A: Hands-Free Grocery Arrival"
            description="Resident arrives carrying groceries; hands-free policy verifies BLE credential and unlocks door automatically."
            icon={UserCheck}
            badge="Security & Entry"
            onClick={() => {
              onStartScenario('scenario_a_groceries');
              onNavigate('live');
            }}
          />

          <ScenarioCard
            title="Scenario B: Blind / Low-Vision Resident"
            description="Neighbor Maya rings bell. KindDoor speaks concise visitor description and offers accessible keyboard/voice choices."
            icon={Volume2}
            badge="Voice-First"
            onClick={() => {
              onStartScenario('scenario_b_blind_resident');
              onNavigate('live');
            }}
          />

          <ScenarioCard
            title="Scenario C: Deaf / Hard-of-Hearing Resident"
            description="Amazon Courier arrives. Delivers high-contrast visual alert banner, live captions, and zero-audio interaction."
            icon={Eye}
            badge="Visual-First"
            onClick={() => {
              onStartScenario('scenario_c_deaf_resident');
              onNavigate('live');
            }}
          />

          <ScenarioCard
            title="Scenario D: Patient Older Adult Assistance"
            description="Visitor Mark arrives. KindDoor reduces complexity into 2 simple binary choices. Silence never counts as consent."
            icon={Shield}
            badge="Cognitive Care"
            onClick={() => {
              onStartScenario('scenario_d_patient_assistance');
              onNavigate('live');
            }}
          />

          <ScenarioCard
            title="Scenario E: Unfamiliar Visitor & Consent Gate"
            description="Visitor John claims to be a friend. Temporary retention set; profile enrollment requires explicit resident consent."
            icon={Radio}
            badge="Privacy & Consent"
            onClick={() => {
              onStartScenario('scenario_e_unfamiliar_visitor');
              onNavigate('live');
            }}
          />
        </div>
      </div>
    </div>
  );
};

const ScenarioCard = ({
  title,
  description,
  icon: Icon,
  badge,
  onClick
}: {
  title: string;
  description: string;
  icon: any;
  badge: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 p-5 rounded-xl transition cursor-pointer flex flex-col justify-between group shadow-sm"
  >
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-medium bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
          {badge}
        </span>
      </div>

      <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition">{title}</h3>

      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>

    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-medium">
      <span>Simulate Scenario</span>
      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
    </div>
  </div>
);
