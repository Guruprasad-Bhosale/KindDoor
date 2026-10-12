import React from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowLeft, ChevronDown } from 'lucide-react';

export const metadata = {
  title: 'Frequently Asked Questions — KindDoor',
  description: 'Frequently asked questions about KindDoor integrations, MCP protocol, Ring, and accessibility.',
};

export default function FAQPage() {
  const faqs = [
    {
      q: 'Does KindDoor claim to connect to the gated Alexa+ developer service?',
      a: 'No. As hackathon participants cannot access gated Alexa+ developer tools, KindDoor implements the officially accepted self-hosted Model Context Protocol (MCP) server (Streamable HTTP, protocol version 2025-11-25) and an interactive Alexa+-style web simulation client that makes real protocol calls.'
    },
    {
      q: 'How does KindDoor handle smart lock security?',
      a: 'KindDoor strictly isolates AI reasoning from physical/simulated lock control. AI models (Amazon Bedrock or fallback engines) cannot directly command the lock. All entry requests must pass through a deterministic AccessPolicyEngine which verifies credentials, resident automation policies, and proximity independently.'
    },
    {
      q: 'Does KindDoor store biometric face embeddings or voiceprints?',
      a: 'No. KindDoor adheres to a strict zero-biometric storage architecture. Visitor presence is represented exclusively as high-level synthetic classifications (likely_match, unverified_claim, unfamiliar_visitor), and temporary visit interactions carry automated retention deadlines.'
    },
    {
      q: 'What happens if Amazon Bedrock AWS credentials are not configured?',
      a: 'KindDoor includes a full-featured offline Deterministic AI Engine that orchestrates the exact same 10 MCP tools and supports all 5 hackathon demonstration scenarios with 100% test coverage and identical security guarantees.'
    },
    {
      q: 'How does KindDoor support deaf or hard-of-hearing residents?',
      a: 'When Visual-First mode is active, all auditory requirements are disabled. KindDoor flashes high-contrast amber alert banners, transcribes visitor statements in real-time captions, and provides accessible touch/click action buttons.'
    }
  ];

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
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Technical & Product FAQ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-slate-400">
            Answers to common questions regarding architecture, security, and hackathon scope.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2">
              <h3 className="font-bold text-white text-base">{faq.q}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
