"use client";

export function Header({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(10,10,10,0.8)] backdrop-blur-md">
      {/* Subtle gold gradient line under header */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="animate-fade-in text-3xl font-bold text-white">
              {title || "Barnscape Studios"}
            </h1>
            <p className="mt-1 text-sm text-gray-400">Modern event space for your perfect gathering</p>
          </div>
        </div>
      </div>
    </header>
  );
}
