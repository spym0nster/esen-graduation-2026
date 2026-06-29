import { kv } from "@vercel/kv";
import { notFound } from "next/navigation";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export default async function VerifyPage({
  params,
}: {
  params: { uuid: string } | Promise<{ uuid: string }>;
}) {
  const resolvedParams = await params;
  const uuid = resolvedParams.uuid;

  let guest: any = null;

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    guest = await kv.get(`rsvp:${uuid}`);
  } else {
    // Mock for local if KV isn't configured
    guest = {
      name: "Mock User",
      role: "Graduate",
      guests: 2,
      scanned: false,
    };
  }

  if (!guest) {
    return notFound();
  }

  const alreadyScanned = guest.scanned;

  if (!alreadyScanned && process.env.KV_REST_API_URL) {
    guest.scanned = true;
    await kv.set(`rsvp:${uuid}`, guest);
  }

  return (
    <div className="min-h-screen bg-[#0D0B0E] flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-8 flex flex-col items-center text-center">
        {alreadyScanned ? (
          <div className="w-20 h-20 rounded-full bg-red-900/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-green-900/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        )}

        <h1 className="font-display text-3xl text-white mb-2">
          {alreadyScanned ? "Already Scanned" : "Access Granted"}
        </h1>
        
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#C9960C] to-transparent my-6 opacity-30" />
        
        <div className="w-full text-left font-sans space-y-5">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-[#8A6A1A] mb-1">Name</div>
            <div className="text-xl text-[#E8E0D0]">{guest.name}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-[#8A6A1A] mb-1">Role</div>
            <div className="text-xl text-[#E8E0D0]">{guest.role}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-[#8A6A1A] mb-1">Guests Accompanying</div>
            <div className="text-xl text-[#E8E0D0]">{guest.guests}</div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
