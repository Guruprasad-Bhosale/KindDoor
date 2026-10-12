'use client';

import React from 'react';
import {
  DoorClosed,
  Lock,
  Unlock,
  AlertTriangle,
  Volume2,
  Eye,
  Sliders,
  Terminal,
  History,
  PlayCircle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  lockStatus: any;
  resident: any;
  onModeChange: (mode: string) => void;
  onLock: () => void;
  onReset: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  lockStatus,
  resident,
  onModeChange,
  onLock,
  onReset
}) => {
  const isUnlocked = lockStatus?.state === 'UNLOCKED';
  const isJammed = lockStatus?.state === 'JAMMED';

  const modes = [
    { key: 'STANDARD', label: 'Standard Mode', icon: UserCheck },
    { key: 'BLIND_LOW_VISION', label: 'Blind / Low-Vision', icon: Volume2 },
    { key: 'DEAF_HARD_OF_HEARING', label: 'Deaf / Hard-of-Hearing', icon: Eye },
    { key: 'PATIENT_SIMPLIFIED', label: 'Patient / Simplified', icon: HeartIcon }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      {/* Top Banner with Lock & Resident Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-500/40 text-amber-400">
            <DoorClosed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">KindDoor</span>
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                Hackathon 2026
              </span>
            </div>
            <p className="text-xs text-slate-400">The front door that adapts to you</p>
          </div>
        </div>

        {/* Lock State Pill (Strictly Labeled as Simulated) */}
        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-colors ${
              isUnlocked
                ? 'bg-green-950/80 border-green-600 text-green-400'
                : isJammed
                ? 'bg-amber-950/80 border-amber-600 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
            role="status"
            aria-live="polite"
          >
            {isUnlocked ? (
              <Unlock className="w-4 h-4 text-green-400 animate-pulse" />
            ) : isJammed ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <Lock className="w-4 h-4 text-slate-400" />
            )}
            <span>SIMULATED LOCK: {lockStatus?.state || 'LOCKED'}</span>
          </div>

          {isUnlocked && (
            <button
              onClick={onLock}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-600 rounded-md transition"
              title="Lock Simulated Door"
            >
              Lock Door
            </button>
          )}

          {isJammed && (
            <button
              onClick={onReset}
              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-xs text-white font-medium rounded-md transition"
            >
              Clear Jam
            </button>
          )}
        </div>

        {/* Quick Accessibility Mode Switcher */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-400 px-2 font-medium">Profile:</span>
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = resident?.accessibility?.mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => onModeChange(m.key)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={`Switch to ${m.label}`}
                aria-pressed={isActive}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{m.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 border-t border-slate-800/80 overflow-x-auto">
        <TabButton
          id="home"
          label="KindDoor Home"
          icon={DoorClosed}
          active={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
        />
        <TabButton
          id="live"
          label="Live Experience"
          icon={Volume2}
          active={activeTab === 'live'}
          onClick={() => setActiveTab('live')}
        />
        <TabButton
          id="simulator"
          label="Scenario Simulator"
          icon={PlayCircle}
          badge="5 Scenarios"
          active={activeTab === 'simulator'}
          onClick={() => setActiveTab('simulator')}
        />
        <TabButton
          id="settings"
          label="Accessibility Settings"
          icon={Sliders}
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
        <TabButton
          id="history"
          label="Activity History"
          icon={History}
          active={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
        />
        <TabButton
          id="inspector"
          label="Developer Inspector"
          icon={Terminal}
          badge="MCP Live"
          active={activeTab === 'inspector'}
          onClick={() => setActiveTab('inspector')}
        />
      </nav>
    </header>
  );
};

function HeartIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}

const TabButton = ({
  id,
  label,
  icon: Icon,
  active,
  badge,
  onClick
}: {
  id: string;
  label: string;
  icon: any;
  active: boolean;
  badge?: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    id={`tab-${id}`}
    className={`flex items-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition ${
      active
        ? 'border-amber-400 text-amber-400 bg-slate-800/40'
        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
    }`}
    aria-selected={active}
    role="tab"
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
    {badge && (
      <span className="ml-1.5 text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full font-mono">
        {badge}
      </span>
    )}
  </button>
);
