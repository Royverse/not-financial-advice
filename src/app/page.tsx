import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="h-screen w-full overflow-hidden relative selection:bg-indigo-500/30">
      {/* Background Blobs for specific Twilight Aesthetic */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      <div className="relative z-10 h-full p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto">
        <Dashboard />
      </div>
    </div>
  );
}
