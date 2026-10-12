'use client';

import React from 'react';
import { Terminal, Cpu, ShieldCheck, Wrench, CheckCircle2, AlertTriangle, RefreshCw, Key } from 'lucide-react';

interface DeveloperInspectorViewProps {
  mcpStatus: any;
  lockStatus: any;
  onJamLock: () => void;
  onResetLock: () => void;
}

export const DeveloperInspectorView: React.FC<DeveloperInspectorViewProps> = ({
  mcpStatus,
  lockStatus,
  onJamLock,
  onResetLock
}) => {
  const tools = mcpStatus?.tools || [];
  const bedrock = mcpStatus?.bedrockStatus || {};

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Developer & MCP Protocol Inspector</h2>
            <p className="text-xs text-slate-400 mt-1">
              Live wire diagnostics for Model Context Protocol (MCP), Bedrock AI orchestration, Ring HMAC validation, and Lock hardware simulation.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>MCP SERVER CONNECTED</span>
          </span>
        </div>
      </div>

      {/* Grid: Protocol & Runtime Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MCP Transport Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>MCP Protocol</span>
            </span>
            <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
              v{mcpStatus?.version || '2025-11-25'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Transport:</span>
              <span className="text-slate-200 font-mono">Streamable HTTP / SSE</span>
            </div>
            <div className="flex justify-between">
              <span>Server Name:</span>
              <span className="text-slate-200 font-mono">{mcpStatus?.serverName || 'KindDoor-MCP-Server'}</span>
            </div>
            <div className="flex justify-between">
              <span>Discovered Tools:</span>
              <span className="text-green-400 font-bold font-mono">{tools.length} Tools</span>
            </div>
          </div>
        </div>

        {/* Amazon Bedrock Runtime Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>AI Runtime Status</span>
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                bedrock.isConfigured
                  ? 'bg-green-950 text-green-400 border-green-800'
                  : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}
            >
              {bedrock.isConfigured ? 'AWS Bedrock' : 'Deterministic Fallback'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Runtime Engine:</span>
              <span className="text-slate-200 font-medium truncate max-w-[180px]">{bedrock.runtime || 'Deterministic Engine'}</span>
            </div>
            <div className="flex justify-between">
              <span>Model ID:</span>
              <span className="text-slate-200 font-mono text-[11px] truncate max-w-[180px]">
                {bedrock.modelId || 'anthropic.claude-3-haiku'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>AWS Region:</span>
              <span className="text-slate-200 font-mono">{bedrock.region || 'us-east-1'}</span>
            </div>
          </div>
        </div>

        {/* Smart Lock Simulation Hardware Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Simulated Lock HW</span>
            </span>
            <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
              State: {lockStatus?.state}
            </span>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={onJamLock}
              className="flex-1 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-400 border border-amber-800 text-xs font-medium rounded-lg transition"
            >
              Simulate Jam
            </button>
            <button
              onClick={onResetLock}
              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium rounded-lg transition"
            >
              Reset HW
            </button>
          </div>
        </div>
      </div>

      {/* Discovered MCP Tools Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Registered Model Context Protocol (MCP) Tools</h3>
            <p className="text-xs text-slate-400">
              Exposed via Streamable HTTP for conversational agent and Alexa+ add-on discovery.
            </p>
          </div>
          <span className="text-xs text-amber-400 font-mono">{tools.length} Tools Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tools.map((tool: any, idx: number) => (
            <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-400 text-sm">{tool.name}</span>
                <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
                  MCP TOOL
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{tool.description}</p>
              {tool.parameters && (
                <div className="text-[11px] text-slate-500 font-mono bg-slate-900/80 p-2 rounded border border-slate-850 overflow-x-auto">
                  Parameters: {JSON.stringify(tool.parameters)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
