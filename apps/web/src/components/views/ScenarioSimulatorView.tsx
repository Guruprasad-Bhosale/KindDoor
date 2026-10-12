'use client';

import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Volume2,
  Eye,
  Heart,
  Shield,
  Radio,
  Lock,
  Unlock,
  RotateCcw
} from 'lucide-react';

interface ScenarioSimulatorViewProps {
  resident: any;
  lockStatus: any;
  isLoading: boolean;
  onRunScenario: (scenarioId: string, customPayload?: Record<string, any>) => void;
  onNavigate: (tab: any) => void;
}

export const ScenarioSimulatorView: React.FC<ScenarioSimulatorViewProps> = ({
  resident,
  lockStatus,
  isLoading,
  onRunScenario,
  onNavigate
}) => {
  const [scenarioA_isNegative, setScenarioA_isNegative] = useState(false);
  const [scenarioD_isConfused, setScenarioD_isConfused] = useState(false);
  const [scenarioE_giveConsent, setScenarioE_giveConsent] = useState(false);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Interactive Scenario Simulator</h2>
          <p className="text-xs text-slate-400 mt-1">
            Execute all five hackathon scenarios end-to-end with live MCP tool dispatch, deterministic policy checks, and accessible feedback.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-slate-400">Lock Status:</span>
          <span className="font-bold text-amber-400 font-mono">{lockStatus?.state || 'LOCKED'}</span>
        </div>
      </div>

      {/* 5 Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SCENARIO A */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
                SCENARIO A
              </span>
              <span className="text-xs text-slate-400">Hands-Free Entry</span>
            </div>

            <h3 className="text-lg font-bold text-white">Resident Arrives with Hands Full</h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Resident approaches carrying groceries. Evaluates configured entry policy, checks BLE credential signal, invokes simulated lock adapter, and verifies returned state.
            </p>

            {/* Configurable Negative Permutation */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-300">Credential Permutation:</span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scenarioA_cred"
                    checked={!scenarioA_isNegative}
                    onChange={() => setScenarioA_isNegative(false)}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-green-400 font-medium">Valid BLE Token (Pass)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scenarioA_cred"
                    checked={scenarioA_isNegative}
                    onChange={() => setScenarioA_isNegative(true)}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-red-400 font-medium">Invalid/Spoofed (Fail)</span>
                </label>
              </div>
            </div>
          </div>

          <button
            disabled={isLoading}
            onClick={() => {
              onRunScenario('scenario_a_groceries', { isNegative: scenarioA_isNegative });
              onNavigate('live');
            }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition shadow-md"
          >
            <Play className="w-4 h-4" />
            <span>Simulate Scenario A</span>
          </button>
        </div>

        {/* SCENARIO B */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
                SCENARIO B
              </span>
              <span className="text-xs text-slate-400">Blind / Low-Vision</span>
            </div>

            <h3 className="text-lg font-bold text-white">Spoken Dialogue for Blind Resident</h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Ring event arrives (Neighbor Maya with gardening tools). KindDoor speaks visitor description, stated purpose, and offers vocal/keyboard shortcuts with instant audio repeat.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-slate-200">Spoken Announcement:</div>
              <p className="italic text-slate-400">
                "Someone is at your front door. It appears to be your neighbor Maya. She says she brought the gardening tools..."
              </p>
            </div>
          </div>

          <button
            disabled={isLoading}
            onClick={() => {
              onRunScenario('scenario_b_blind_resident');
              onNavigate('live');
            }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition shadow-md"
          >
            <Volume2 className="w-4 h-4" />
            <span>Simulate Scenario B</span>
          </button>
        </div>

        {/* SCENARIO C */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
                SCENARIO C
              </span>
              <span className="text-xs text-slate-400">Deaf / Hard-of-Hearing</span>
            </div>

            <h3 className="text-lg font-bold text-white">Visual-First Delivery Notification</h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Amazon Courier package delivery event. Delivers zero-audio visual alerts, high-contrast live transcript, and accessible action buttons (Leave on Porch, Acknowledge).
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-slate-200">Visual Features:</div>
              <p className="text-slate-400">
                Pulsing alert banner, live caption cards, delivery retention deadline.
              </p>
            </div>
          </div>

          <button
            disabled={isLoading}
            onClick={() => {
              onRunScenario('scenario_c_deaf_resident');
              onNavigate('live');
            }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition shadow-md"
          >
            <Eye className="w-4 h-4" />
            <span>Simulate Scenario C</span>
          </button>
        </div>

        {/* SCENARIO D */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
                SCENARIO D
              </span>
              <span className="text-xs text-slate-400">Cognitive & Patient Care</span>
            </div>

            <h3 className="text-lg font-bold text-white">Patient Assistance for Older Adult</h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Demonstrates natural language, patient repetition, and simplified 2-choice options. Silence never counts as consent; system never pressures resident.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-300">Dialogue Step:</span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scenarioD_step"
                    checked={!scenarioD_isConfused}
                    onChange={() => setScenarioD_isConfused(false)}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-slate-200">"Who is at the door?"</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scenarioD_step"
                    checked={scenarioD_isConfused}
                    onChange={() => setScenarioD_isConfused(true)}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-slate-200">"I don't understand" (Simplifies)</span>
                </label>
              </div>
            </div>
          </div>

          <button
            disabled={isLoading}
            onClick={() => {
              onRunScenario('scenario_d_patient_assistance', { isConfused: scenarioD_isConfused });
              onNavigate('live');
            }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition shadow-md"
          >
            <Heart className="w-4 h-4" />
            <span>Simulate Scenario D</span>
          </button>
        </div>

        {/* SCENARIO E */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 md:col-span-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
                SCENARIO E
              </span>
              <span className="text-xs text-slate-400">Privacy & Consent Gate</span>
            </div>

            <h3 className="text-lg font-bold text-white">Unfamiliar Visitor & Consent-Gated Enrollment</h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Visitor John states: "I'm John. I'm a family friend." KindDoor distinguishes claimed from verified identity, temporarily stores metadata with retention deadline, and forbids enrollment without explicit resident consent.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-300">Enrollment Action:</span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scenarioE_consent"
                    checked={!scenarioE_giveConsent}
                    onChange={() => setScenarioE_giveConsent(false)}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-slate-200">Initial Inquiry (Unverified claim)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scenarioE_consent"
                    checked={scenarioE_giveConsent}
                    onChange={() => setScenarioE_giveConsent(true)}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-green-400 font-medium">Grant Consent & Enroll Profile</span>
                </label>
              </div>
            </div>
          </div>

          <button
            disabled={isLoading}
            onClick={() => {
              onRunScenario('scenario_e_unfamiliar_visitor', { giveConsent: scenarioE_giveConsent });
              onNavigate('live');
            }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition shadow-md"
          >
            <Shield className="w-4 h-4" />
            <span>Simulate Scenario E</span>
          </button>
        </div>
      </div>
    </div>
  );
};
