import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { handleZkLoginCallback } from "@/lib/zkLogin";
import { useZkLogin } from "@/lib/zkLoginContext";

export default function ZkLoginCallback() {
  const router = useRouter();
  const { setZkSession } = useZkLogin();
  const [status, setStatus] = useState("Processing login...");

  useEffect(() => {
    async function process() {
      try {
        const session = await handleZkLoginCallback();
        if (session) {
          setZkSession(session);
          setStatus("Login successful! Redirecting...");
          setTimeout(() => router.push("/"), 1000);
        } else {
          setStatus("Login failed. No JWT found.");
          setTimeout(() => router.push("/"), 2000);
        }
      } catch (err) {
        console.error("zkLogin callback error:", err);
        setStatus("Login failed. Please try again.");
        setTimeout(() => router.push("/"), 2000);
      }
    }
    process();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
        <p className="text-lg text-gray-700">{status}</p>
      </div>
    </div>
  );
}
