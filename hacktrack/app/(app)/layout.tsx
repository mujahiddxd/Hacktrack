export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      {children}
    </main>
  );
}
