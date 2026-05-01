"use client";

export function Header({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(10,10,10,0.8)] backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{title || "Barnscape Studios"}</h1>
            <p className="mt-1 text-sm text-gray-400">Modern event space for your perfect gathering</p>
          </div>
        </div>
      </div>
    </header>
  );
}
