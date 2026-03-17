import { generateNonce, generateRandomness, jwtToAddress } from "@mysten/sui/zklogin";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";

// Prover service endpoint (Mysten Labs public prover for testnet)
export const PROVER_URL = "https://prover-dev.mystenlabs.com/v1";

// Google OAuth client ID — set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export const MAX_EPOCH_DURATION = 2; // epochs the ephemeral key stays valid

export interface ZkLoginSession {
  ephemeralKeyPair: Ed25519Keypair;
  randomness: string;
  nonce: string;
  maxEpoch: number;
  userAddress: string;
  jwt: string;
  zkProof: ZkProof | null;
}

export interface ZkProof {
  proofPoints: {
    a: string[];
    b: string[][];
    c: string[];
  };
  issBase64Details: {
    value: string;
    indexMod4: number;
  };
  headerBase64: string;
}

/** Generate ephemeral keypair + nonce, store in sessionStorage, redirect to Google */
export async function initiateZkLogin(suiClient: SuiClient): Promise<void> {
  if (!GOOGLE_CLIENT_ID) throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");

  const { epoch } = await suiClient.getLatestSuiSystemState();
  const maxEpoch = Number(epoch) + MAX_EPOCH_DURATION;

  const ephemeralKeyPair = new Ed25519Keypair();
  const randomness = generateRandomness();
  const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);

  // Persist for after OAuth redirect
  sessionStorage.setItem("zklogin_ephemeral_secret", ephemeralKeyPair.getSecretKey());
  sessionStorage.setItem("zklogin_randomness", randomness);
  sessionStorage.setItem("zklogin_max_epoch", String(maxEpoch));

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: window.location.origin + "/zklogin-callback",
    response_type: "id_token",
    scope: "openid email",
    nonce,
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Called on the callback page — extracts JWT from URL hash, computes address, fetches proof */
export async function handleZkLoginCallback(): Promise<ZkLoginSession | null> {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const jwt = params.get("id_token");
  if (!jwt) return null;

  const secretKey = sessionStorage.getItem("zklogin_ephemeral_secret");
  const randomness = sessionStorage.getItem("zklogin_randomness");
  const maxEpoch = sessionStorage.getItem("zklogin_max_epoch");

  if (!secretKey || !randomness || !maxEpoch) return null;

  const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(secretKey);
  const userAddress = jwtToAddress(jwt, randomness);

  // Fetch ZK proof from prover
  const zkProof = await fetchZkProof({
    jwt,
    ephemeralPublicKey: ephemeralKeyPair.getPublicKey().toBase64(),
    maxEpoch: Number(maxEpoch),
    randomness,
    userAddress,
  });

  const session: ZkLoginSession = {
    ephemeralKeyPair,
    randomness,
    nonce: "",
    maxEpoch: Number(maxEpoch),
    userAddress,
    jwt,
    zkProof,
  };

  // Persist session
  sessionStorage.setItem("zklogin_session", JSON.stringify({
    ephemeralSecret: secretKey,
    randomness,
    maxEpoch,
    userAddress,
    jwt,
    zkProof,
  }));

  return session;
}

/** Restore session from sessionStorage */
export function restoreZkLoginSession(): ZkLoginSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("zklogin_session");
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(data.ephemeralSecret);
    return {
      ephemeralKeyPair,
      randomness: data.randomness,
      nonce: "",
      maxEpoch: Number(data.maxEpoch),
      userAddress: data.userAddress,
      jwt: data.jwt,
      zkProof: data.zkProof,
    };
  } catch {
    return null;
  }
}

export function clearZkLoginSession(): void {
  sessionStorage.removeItem("zklogin_session");
  sessionStorage.removeItem("zklogin_ephemeral_secret");
  sessionStorage.removeItem("zklogin_randomness");
  sessionStorage.removeItem("zklogin_max_epoch");
}

async function fetchZkProof(params: {
  jwt: string;
  ephemeralPublicKey: string;
  maxEpoch: number;
  randomness: string;
  userAddress: string;
}): Promise<ZkProof | null> {
  try {
    const res = await fetch(PROVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jwt: params.jwt,
        extendedEphemeralPublicKey: params.ephemeralPublicKey,
        maxEpoch: params.maxEpoch,
        jwtRandomness: params.randomness,
        salt: params.userAddress,
        keyClaimName: "sub",
      }),
    });
    if (!res.ok) {
      console.error("Prover error:", await res.text());
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch ZK proof:", err);
    return null;
  }
}
