import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, AlertTriangle, ShieldAlert, Cpu } from 'lucide-react';

export const metadata = {
  title: 'Terms of Use — KindDoor',
  description: 'KindDoor Terms of Use and Simulated Hardware Disclaimer for Amazon Developer Hackathon 2026.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs text-amber-400 hover:text-amber-300 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to KindDoor Dashboard</span>
        </Link>

        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-medium text-amber-400">
            <FileText className="w-3.5 h-3.5" />
            <span>Hackathon Terms & Licensing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Use & Safety Disclaimer
          </h1>
          <p className="text-sm text-slate-400">
            Version 1.0 • Amazon Developer Hackathon 2026 Submission
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl">
          <section className="space-y-3 bg-amber-950/40 border border-amber-500/40 p-5 rounded-xl">
            <h2 className="text-base font-bold text-amber-400 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Simulated Hardware & Safety Notice</span>
            </h2>
            <p className="text-xs text-slate-300">
              KindDoor contains a software-simulated smart lock adapter. In this prototype, lock commands operate exclusively within a virtual state machine (<code className="text-amber-300">LOCKED</code>, <code className="text-amber-300">UNLOCKED</code>, <code className="text-amber-300">JAMMED</code>) and do <strong>NOT</strong> control physical residential deadbolts or high-voltage entry hardware. Never connect prototype software directly to physical ingress points without production-grade safety interlocks.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              <span>1. Hackathon Prototype Scope</span>
            </h2>
            <p>
              KindDoor is engineered as a functional prototype for the Amazon Developer Hackathon 2026. It demonstrates a self-hosted Streamable HTTP Model Context Protocol (MCP) server, Ring webhook ingestion, Amazon Bedrock Converse AI orchestration, and accessibility accommodations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>2. Separation of AI from Physical Security</span>
            </h2>
            <p>
              Users acknowledge that conversational AI agents and LLMs provide natural language comprehension and dialogue formatting only. All authorization determinations are executed strictly by deterministic, independently auditable code (<code className="text-amber-400">AccessPolicyEngine</code>).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Open-Source Licensing</h2>
            <p>
              KindDoor source code is released under the <strong>Apache License, Version 2.0</strong>. See the <Link href="/LICENSE" className="text-amber-400 underline">LICENSE</Link> file in the root repository for complete terms and permissions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
