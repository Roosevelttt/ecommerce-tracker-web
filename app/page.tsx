import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#191917] text-white p-4">
      <main className="text-center max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
          Prisynced <span className="text-[#D5FF40]">.</span>
        </h1>
        <p className="text-xl text-[#C0C2B8] mb-12 leading-relaxed">
          The automated agent that watches Amazon prices so you don't have to. 
          Receive instant alerts via email when prices drop or stocks return.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/dashboard"
            className="bg-[#D5FF40] text-[#191917] font-bold px-8 py-4 rounded-lg hover:opacity-90 transition text-lg"
          >
            Launch Tracker
          </Link>
        </div>
      </main>
      
      <footer className="absolute bottom-8 text-[#555] text-sm">
        Powered by AWS Lambda, DynamoDB & EventBridge
      </footer>
    </div>
  );
}