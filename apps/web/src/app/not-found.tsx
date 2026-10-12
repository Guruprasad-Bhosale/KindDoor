import React from 'react';
import Link from 'next/link';
import { DoorClosed, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-slate-900 border border-slate-800 p-8 md:p-12 rounded-2xl max-w-lg w-full space-y-6 shadow-2xl">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
          <DoorClosed className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-slate-200">Door Not Found</h2>
          <p className="text-xs text-slate-400">
            The page or entrance route you are looking for does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition"
          >
            <Home className="w-4 h-4" />
            <span>Return to KindDoor</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
