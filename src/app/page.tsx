import Dashboard from "@/components/dashboard/Dashboard";

export default function Home() {
  return (
    <div className="min-h-screen lg:h-screen w-full overflow-y-auto lg:overflow-hidden relative">
      {/* Ambient glow — subtle, not distracting */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[60%] h-[40%] bg-indigo-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[40%] h-[30%] bg-indigo-500/[0.02] rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 h-full p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto">
        <Dashboard />
      </div>
    </div>
  );
}
