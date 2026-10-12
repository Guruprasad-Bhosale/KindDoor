'use client';

import React from 'react';
import { History, Shield, Lock, Bell, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ActivityHistoryViewProps {
  events: any[];
  auditLogs: any[];
}

export const ActivityHistoryView: React.FC<ActivityHistoryViewProps> = ({ events, auditLogs }) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Activity & Audit Trail</h2>
            <p className="text-xs text-slate-400 mt-1">
              Immutable timeline of door sensor events, access policy evaluations, and lock actuations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Door Events Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Recent Door Events ({events.length})</span>
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="text-xs text-slate-500 p-4 text-center">No door events recorded yet.</div>
            ) : (
              events.map((evt, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase">{evt.type}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-slate-400 flex items-center justify-between">
                    <span>Source: {evt.source}</span>
                    <span className="text-amber-400 font-mono text-[10px]">ID: {evt.id.substring(0, 14)}...</span>
                  </div>
                  {evt.claimedIdentity && (
                    <div className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">
                      <strong>Claim:</strong> {evt.claimedIdentity.statedName} — {evt.claimedIdentity.statedPurpose}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Policy & Lock Audit Trail */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span>Policy & Lock Audit Logs ({auditLogs.length})</span>
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <div className="text-xs text-slate-500 p-4 text-center">No audit logs recorded yet.</div>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-green-400">{log.eventType}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-slate-400">Actor: {log.actor}</div>
                  <div className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.details)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
