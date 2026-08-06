export default function AnimatedBackground() {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[8%] top-[12%] h-72 w-72 animate-pulse rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[10%] top-[22%] h-80 w-80 animate-pulse rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-[8%] left-[35%] h-72 w-72 animate-pulse rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-[20%] right-[30%] h-64 w-64 animate-pulse rounded-full bg-pink-500/10 blur-3xl" />
  
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.04]" />
      </div>
    );
  }