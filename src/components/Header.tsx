"use client";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#2a2a3a]/50">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-amber-500/20">
          BS
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold text-white">Barnscape Studios</h1>
          <p className="text-[11px] text-[#6b6b80]">Event Space Booking</p>
        </div>
      </div>
    </header>
  );
}
