import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Trash2, EyeOff, UserCheck } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — KindDoor',
  description: 'KindDoor privacy-first principles: zero biometric storage, retention deadlines, and resident consent.',
};

export default function PrivacyPage() {
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy by Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            KindDoor Privacy Policy
          </h1>
          <p className="text-sm text-slate-400">
            Effective Date: October 2026 • Amazon Developer Hackathon 2026 Prototype
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <EyeOff className="w-5 h-5 text-amber-400" />
              <span>1. Zero Biometric Storage Principle</span>
            </h2>
            <p>
              KindDoor does <strong>NOT</strong> collect, compute, or store raw biometric identifiers, including facial geometry vectors, facial embeddings, or voiceprints. Visitor presence is processed exclusively through high-level synthetic categorization (<code className="text-amber-400">likely_match</code>, <code className="text-amber-400">unverified_claim</code>, <code className="text-amber-400">unfamiliar_visitor</code>).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Trash2 className="w-5 h-5 text-amber-400" />
              <span>2. Automated Retention Deadlines & Data Purging</span>
            </h2>
            <p>
              All visitor interactions and delivery records carry strict, immutable retention deadlines:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
              <li><strong>Delivery Interactions:</strong> Automatically flagged for purge after 48 hours.</li>
              <li><strong>Temporary Guest Inquiries:</strong> Retained for a maximum of 30 days.</li>
              <li><strong>Expired Record Removal:</strong> Expired data is permanently purged via automated scheduled sweeps or direct resident purge triggers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <span>3. Explicit Consent-Gated Visitor Profiles</span>
            </h2>
            <p>
              No artificial intelligence, machine learning model, or automated system rule can autonomously enroll or persist a visitor profile without the resident’s explicit, recorded consent. Every regular visitor enrollment generates an immutable audit entry referencing the resident’s affirmative confirmation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <span>4. Resident Right to Revocation & Erasure</span>
            </h2>
            <p>
              Residents have sovereign control over all stored data. Enrolled visitor profiles and interaction histories can be revoked or erased at any time through resident settings or dedicated API endpoints.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
