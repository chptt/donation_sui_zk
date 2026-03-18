import {
  genAddressSeed,
  getZkLoginSignature,
  decodeJwt,
} from "@mysten/sui/zklogin";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { PublicKey } from "@mysten/sui/cryptography";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

export const ENOKI_API_KEY = process.env.NEXT_PUBLIC_ENOKI_API_KEY || "";
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
export const MAX_EPOCH_DURATION = 2;

/**
 * Enoki nonce endpoint expects ephemeralPublicKey as toSuiBytes() base64
 * (flag byte + 32 raw bytes = 33 bytes total).
 */
function toSuiBase64(publicKey: PublicKey): string {
  const bytes = publicKey.toSuiBytes(); // 33 bytes: flag + raw
  return btoa(Array.from(bytes).map(b => String.fromCharCode(b)).join(""));
}

export interface ZkLoginSession {
  ephemeralKeyPair: Ed25519Keypair;
  // Raw 32-byte base64 public key — what Enoki ZKP endpoint expects
  ephemeralPublicKeyB64: string;
  randomness: string;
  salt: string;
  maxEpoch: number;
  userAddress: string;
  jwt: string;
}

export function isJwtValid(jwt: string): boolean {
  try {
    const decoded = decodeJwt(jwt);
    const exp = decoded.exp as number;
    if (!exp) return false;
    return Date.now() / 1000 < exp;
  } catch {
    return false;
  }
}

/** Step 1: Generate nonce via Enoki, store ephemeral key, redirect to Google */
export async function initiateZkLogin(suiClient: SuiClient): Promise<void> {
  if (!GOOGLE_CLIENT_ID) throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
  if (!ENOKI_API_KEY) throw new Error("NEXT_PUBLIC_ENOKI_API_KEY is not set");

  const ephemeralKeyPair = new Ed25519Keypair();
  const ephemeralPublicKeyB64 = toSuiBase64(ephemeralKeyPair.getPublicKey());

  // Get nonce + randomness + maxEpoch from Enoki
  const nonceRes = await fetch("https://api.enoki.mystenlabs.com/v1/zklogin/nonce", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ENOKI_API_KEY}`,
    },
    body: JSON.stringify({ ephemeralPublicKey: ephemeralPublicKeyB64, network: "testnet" }),
  });
  if (!nonceRes.ok) {
    const err = await nonceRes.text();
    throw new Error(`Enoki nonce error: ${err}`);
  }
  const { data } = await nonceRes.json();
  const { nonce, randomness, maxEpoch } = data;

  console.log("[zkLogin:init] maxEpoch:", maxEpoch);
  console.log("[zkLogin:init] randomness:", randomness);
  console.log("[zkLogin:init] nonce:", nonce);
  console.log("[zkLogin:init] ephemeralPublicKeyB64:", ephemeralPublicKeyB64);

  sessionStorage.setItem("zklogin_ephemeral_secret", ephemeralKeyPair.getSecretKey());
  sessionStorage.setItem("zklogin_randomness", randomness);
  sessionStorage.setItem("zklogin_max_epoch", String(maxEpoch));
  sessionStorage.setItem("zklogin_epk_b64", ephemeralPublicKeyB64);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: window.location.origin + "/zklogin-callback",
    response_type: "id_token",
    scope: "openid email",
    nonce,
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Step 2: Handle OAuth callback — get salt from Enoki, build session */
export async function handleZkLoginCallback(): Promise<ZkLoginSession | null> {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const jwt = params.get("id_token");
  if (!jwt) return null;

  const secretKey = sessionStorage.getItem("zklogin_ephemeral_secret");
  const randomness = sessionStorage.getItem("zklogin_randomness");
  const maxEpoch = sessionStorage.getItem("zklogin_max_epoch");
  const ephemeralPublicKeyB64 = sessionStorage.getItem("zklogin_epk_b64");

  if (!secretKey || !randomness || !maxEpoch || !ephemeralPublicKeyB64) {
    console.error("[zkLogin:callback] Missing session storage values");
    return null;
  }

  // Get salt + address from Enoki using the JWT
  const saltRes = await fetch("https://api.enoki.mystenlabs.com/v1/zklogin", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${ENOKI_API_KEY}`,
      "zklogin-jwt": jwt,
    },
  });
  if (!saltRes.ok) {
    console.error("[zkLogin:callback] Enoki salt error:", await saltRes.text());
    return null;
  }
  const { data: saltData } = await saltRes.json();
  const salt = saltData.salt as string;
  const userAddress = saltData.address as string;

  const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(secretKey);

  console.log("[zkLogin:callback] salt:", salt);
  console.log("[zkLogin:callback] maxEpoch:", maxEpoch);
  console.log("[zkLogin:callback] randomness:", randomness);
  console.log("[zkLogin:callback] ephemeralPublicKeyB64:", ephemeralPublicKeyB64);
  console.log("[zkLogin:callback] userAddress:", userAddress);

  const session: ZkLoginSession = {
    ephemeralKeyPair,
    ephemeralPublicKeyB64,
    randomness,
    salt,
    maxEpoch: Number(maxEpoch),
    userAddress,
    jwt,
  };

  sessionStorage.setItem("zklogin_session", JSON.stringify({
    ephemeralSecret: secretKey,
    ephemeralPublicKeyB64,
    randomness,
    salt,
    maxEpoch,
    userAddress,
    jwt,
  }));

  return session;
}

/** Step 3: Execute a transaction with zkLogin — fetches fresh proof each time */
export async function executeZkLoginTransaction(
  tx: Transaction,
  session: ZkLoginSession,
  suiClient: SuiClient,
): Promise<void> {
  if (!isJwtValid(session.jwt)) {
    throw new Error("Your Google session has expired. Please sign in with Google again.");
  }

  const { epoch } = await suiClient.getLatestSuiSystemState();
  if (Number(epoch) > session.maxEpoch) {
    throw new Error("Your zkLogin session has expired. Please sign in with Google again.");
  }

  tx.setSender(session.userAddress);

  // Sign with ephemeral key FIRST
  const { bytes, signature: ephemeralSig } = await tx.sign({
    client: suiClient,
    signer: session.ephemeralKeyPair,
  });

  console.log("[zkLogin:exec] ephemeralPublicKeyB64:", session.ephemeralPublicKeyB64);
  console.log("[zkLogin:exec] maxEpoch:", session.maxEpoch);
  console.log("[zkLogin:exec] randomness:", session.randomness);
  console.log("[zkLogin:exec] salt:", session.salt);

  // Fetch proof from Enoki ZKP endpoint
  const proof = await fetchZkProof({
    jwt: session.jwt,
    ephemeralPublicKeyB64: session.ephemeralPublicKeyB64,
    maxEpoch: session.maxEpoch,
    randomness: session.randomness,
    salt: session.salt,
  });

  if (!proof) throw new Error("Failed to get ZK proof. Please sign in again.");

  console.log("[zkLogin:exec] proof:", JSON.stringify(proof));

  // Compute addressSeed
  const decoded = decodeJwt(session.jwt);
  const aud = Array.isArray(decoded.aud) ? decoded.aud[0] : (decoded.aud as string);
  const addressSeed = genAddressSeed(
    BigInt(session.salt),
    "sub",
    decoded.sub as string,
    aud,
  ).toString();

  console.log("[zkLogin:exec] addressSeed:", addressSeed);

  const zkLoginSignature = getZkLoginSignature({
    inputs: { ...proof, addressSeed },
    maxEpoch: session.maxEpoch,
    userSignature: ephemeralSig,
  });

  await suiClient.executeTransactionBlock({
    transactionBlock: bytes,
    signature: zkLoginSignature,
    options: { showEffects: true },
  });
}

export function restoreZkLoginSession(): ZkLoginSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("zklogin_session");
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(data.ephemeralSecret);
    return {
      ephemeralKeyPair,
      ephemeralPublicKeyB64: data.ephemeralPublicKeyB64,
      randomness: data.randomness,
      salt: data.salt,
      maxEpoch: Number(data.maxEpoch),
      userAddress: data.userAddress,
      jwt: data.jwt,
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
  sessionStorage.removeItem("zklogin_epk_b64");
}

async function fetchZkProof(params: {
  jwt: string;
  ephemeralPublicKeyB64: string;
  maxEpoch: number;
  randomness: string;
  salt: string;
}): Promise<{ proofPoints: { a: string[]; b: string[][]; c: string[] }; issBase64Details: { value: string; indexMod4: number }; headerBase64: string } | null> {
  try {
    const body = {
      ephemeralPublicKey: params.ephemeralPublicKeyB64,
      maxEpoch: params.maxEpoch,
      randomness: params.randomness,
    };
    console.log("[zkLogin:prover] request body:", JSON.stringify(body));

    const res = await fetch("https://api.enoki.mystenlabs.com/v1/zklogin/zkp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ENOKI_API_KEY}`,
        "zklogin-jwt": params.jwt,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[zkLogin:prover] error:", err);
      return null;
    }
    const json = await res.json();
    console.log("[zkLogin:prover] response:", JSON.stringify(json));
    // Enoki wraps response in { data: { proofPoints, issBase64Details, headerBase64 } }
    return json.data ?? json;
  } catch (err) {
    console.error("[zkLogin:prover] fetch failed:", err);
    return null;
  }
}
