export default function Loading() {
  // Full screen (above the navbar) so only the loader is visible while a page loads
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-canvas"
    >
      <div className="ht-press flex h-14 w-14 items-center justify-center rounded-xl border-3 border-ink bg-[#FFEB3B] text-on-accent text-xl font-black">
        HT
      </div>
      <div className="h-2.5 w-40 overflow-hidden rounded-full border-2 border-ink bg-surface">
        <div className="ht-progress h-full w-2/5 rounded-full bg-[#2196F3] text-on-accent" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
