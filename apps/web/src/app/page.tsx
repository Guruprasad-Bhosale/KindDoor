'use client';

import React from 'react';
import { useKindDoor } from '@/hooks/useKindDoor';
import { Navigation } from '@/components/Navigation';
import { HomeView } from '@/components/views/HomeView';
import { LiveExperienceView } from '@/components/views/LiveExperienceView';
import { ScenarioSimulatorView } from '@/components/views/ScenarioSimulatorView';
import { AccessibilitySettingsView } from '@/components/views/AccessibilitySettingsView';
import { ActivityHistoryView } from '@/components/views/ActivityHistoryView';
import { DeveloperInspectorView } from '@/components/views/DeveloperInspectorView';

export default function KindDoorApp() {
  const {
    resident,
    lockStatus,
    mcpStatus,
    events,
    auditLogs,
    activeTab,
    setActiveTab,
    isLoading,
    lastInteraction,
    toastMessage,
    speech,
    lockDoor,
    jamLock,
    resetLock,
    setAccessibilityMode,
    triggerScenario,
    sendMessage,
    showToast
  } = useKindDoor();

  const handleUpdatePreferences = async (updates: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/resident/accessibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        showToast('Settings successfully updated!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConsentEnroll = () => {
    triggerScenario('scenario_e_unfamiliar_visitor', { giveConsent: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce"
        >
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Accessible Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lockStatus={lockStatus}
        resident={resident}
        onModeChange={setAccessibilityMode}
        onLock={lockDoor}
        onReset={resetLock}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <HomeView
            resident={resident}
            lockStatus={lockStatus}
            mcpStatus={mcpStatus}
            events={events}
            onStartScenario={(sc) => triggerScenario(sc)}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'live' && (
          <LiveExperienceView
            resident={resident}
            lockStatus={lockStatus}
            lastInteraction={lastInteraction}
            isLoading={isLoading}
            speech={speech}
            onSendMessage={sendMessage}
            onConsentEnroll={handleConsentEnroll}
          />
        )}

        {activeTab === 'simulator' && (
          <ScenarioSimulatorView
            resident={resident}
            lockStatus={lockStatus}
            isLoading={isLoading}
            onRunScenario={triggerScenario}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'settings' && (
          <AccessibilitySettingsView
            resident={resident}
            isLoading={isLoading}
            onSave={handleUpdatePreferences}
            showToast={showToast}
          />
        )}

        {activeTab === 'history' && (
          <ActivityHistoryView events={events} auditLogs={auditLogs} />
        )}

        {activeTab === 'inspector' && (
          <DeveloperInspectorView
            mcpStatus={mcpStatus}
            lockStatus={lockStatus}
            lastInteraction={lastInteraction}
            onJamLock={jamLock}
            onResetLock={resetLock}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">KindDoor</span>
            <span>•</span>
            <span>Amazon Developer Hackathon 2026</span>
          </div>

          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <a href="/about" className="hover:text-amber-400 transition">About</a>
            <a href="/faq" className="hover:text-amber-400 transition">FAQ</a>
            <a href="/privacy" className="hover:text-amber-400 transition">Privacy Policy</a>
            <a href="/terms" className="hover:text-amber-400 transition">Terms & Safety</a>
          </div>

          <span className="text-[11px] text-slate-500">
            Alexa+ (Self-Hosted MCP) • Ring Ingestion • Amazon Bedrock AI
          </span>
        </div>
      </footer>
    </div>
  );
}
