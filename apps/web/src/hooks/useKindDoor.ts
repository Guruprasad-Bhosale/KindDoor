'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSpeech } from './useSpeech';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useKindDoor() {
  const [resident, setResident] = useState<any>(null);
  const [lockStatus, setLockStatus] = useState<any>({ state: 'LOCKED', batteryPct: 94, isSimulated: true });
  const [mcpStatus, setMcpStatus] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'live' | 'simulator' | 'settings' | 'history' | 'inspector'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [lastInteraction, setLastInteraction] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const speech = useSpeech({
    enabled: true,
    rate: resident?.accessibility?.speechRate || 1.0,
    pitch: resident?.accessibility?.speechPitch || 1.0
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // 1. Resident
      const resRes = await fetch(`${API_BASE}/api/resident`);
      if (resRes.ok) {
        const resData = await resRes.json();
        setResident(resData);
      }

      // 2. Lock
      const lockRes = await fetch(`${API_BASE}/api/lock`);
      if (lockRes.ok) {
        const lockData = await lockRes.json();
        setLockStatus(lockData);
      }

      // 3. MCP Status
      const mcpRes = await fetch(`${API_BASE}/api/mcp/status`);
      if (mcpRes.ok) {
        const mcpData = await mcpRes.json();
        setMcpStatus(mcpData);
      }

      // 4. Events & Audit
      const evRes = await fetch(`${API_BASE}/api/events`);
      if (evRes.ok) {
        const evData = await evRes.json();
        setEvents(evData.events || []);
        setAuditLogs(evData.auditLogs || []);
      }
    } catch (err) {
      console.warn('Data sync note (server may still be starting):', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Lock Actions
  const lockDoor = async () => {
    await fetch(`${API_BASE}/api/lock/lock`, { method: 'POST' });
    await fetchData();
    showToast('Simulated lock locked.');
  };

  const jamLock = async () => {
    await fetch(`${API_BASE}/api/lock/jam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Simulated mechanical bolt obstruction' })
    });
    await fetchData();
    showToast('⚠️ Lock jam condition simulated.');
  };

  const resetLock = async () => {
    await fetch(`${API_BASE}/api/lock/reset`, { method: 'POST' });
    await fetchData();
    showToast('Simulated lock reset to default LOCKED state.');
  };

  // Switch Accessibility Mode
  const setAccessibilityMode = async (mode: string) => {
    if (!resident) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/resident/accessibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      if (res.ok) {
        const updated = await res.json();
        setResident(updated);
        showToast(`Accessibility profile switched to ${mode.replace(/_/g, ' ')}.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Scenario
  const triggerScenario = async (scenarioId: string, customPayload: Record<string, any> = {}) => {
    setIsLoading(true);
    try {
      // 1. Post to Simulator Trigger
      await fetch(`${API_BASE}/api/simulator/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenarioId,
          ...customPayload
        })
      });

      // 2. Interact with Assistant
      const messageMap: Record<string, string> = {
        scenario_a_groceries: customPayload.isNegative
          ? 'Resident approaching door with invalid BLE token.'
          : 'Resident approaching door carrying groceries with authorized hands-free BLE beacon.',
        scenario_b_blind_resident: 'Neighbor Maya is ringing the doorbell with gardening tools.',
        scenario_c_deaf_resident: 'Amazon delivery courier is at the door with a package for Eleanor.',
        scenario_d_patient_assistance: customPayload.isConfused ? "I don't understand." : 'Who is at the door?',
        scenario_e_unfamiliar_visitor: customPayload.giveConsent
          ? 'I authorize and give consent to enroll John as a regular visitor.'
          : "Visitor at the door claims: I'm John. I'm a family friend."
      };

      const assistantRes = await fetch(`${API_BASE}/api/assistant/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId: resident?.id || 'res-eleanor-001',
          scenarioId,
          message: messageMap[scenarioId] || 'Visitor at front door.'
        })
      });

      if (assistantRes.ok) {
        const interaction = await assistantRes.json();
        setLastInteraction(interaction);

        // Speak audio if spoken feedback enabled
        if (resident?.accessibility?.spokenFeedbackEnabled && interaction.audioAnnouncementText) {
          speech.speak(interaction.audioAnnouncementText, {
            rate: resident?.accessibility?.speechRate || 1.0,
            pitch: resident?.accessibility?.speechPitch || 1.0
          });
        }
      }

      await fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  // Assistant Direct Chat
  const sendMessage = async (message: string) => {
    if (!message.trim()) return;
    setIsLoading(true);
    try {
      const assistantRes = await fetch(`${API_BASE}/api/assistant/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId: resident?.id || 'res-eleanor-001',
          message
        })
      });

      if (assistantRes.ok) {
        const interaction = await assistantRes.json();
        setLastInteraction(interaction);

        if (resident?.accessibility?.spokenFeedbackEnabled && interaction.audioAnnouncementText) {
          speech.speak(interaction.audioAnnouncementText, {
            rate: resident?.accessibility?.speechRate || 1.0,
            pitch: resident?.accessibility?.speechPitch || 1.0
          });
        }
      }
      await fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
}
