"use client";

export function Header({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-50 bg-[#0d1117]/80 backdrop-blur-xl border-b border-[#30363d]/50">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-amber-500/20">
          BS
        </div>
        <div>
          <h1 className="text-base font-semibold text-white leading-tight">{title || "Barnscape Studios"}</h1>
          <p className="text-[11px] text-[#8b949e]">Event Space Booking</p>
        </div>
      </div>
    </header>
  );
}
