import {
  generateNonce,
  generateRandomness,
  jwtToAddress,
  decodeJwt,
  getExtendedEphemeralPublicKey,
  genAddressSeed,
} from "@mysten/sui/zklogin";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import { getZkLoginSignature } from "@mysten/sui/zklogin";
import { Transaction } from "@mysten/sui/transactions";

export const PROVER_URL = "https://prover-dev.mystenlabs.com/v1";
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
export const MAX_EPOCH_DURATION = 2;

export interface ZkLoginSession {
  ephemeralKeyPair: Ed25519Keypair;
  randomness: string;
  salt: string;
  maxEpoch: number;
  userAddress: string;
  jwt: string;
  zkProof: ZkProof | null;
}

export interface ZkProof {
  proofPoints: { a: string[]; b: string[][]; c: string[] };
  issBase64Details: { value: string; indexMod4: number };
  headerBase64: string;
}

function getUserSalt(sub: string): string {
  const key = `zklogin_salt_${sub}`;
  let salt = localStorage.getItem(key);
  if (!salt) {
    salt = generateRandomness();
    localStorage.setItem(key, salt);
  }
  return salt;
}

export function computeAddressSeed(salt: string, jwt: string): string {
  const decoded = decodeJwt(jwt);
  const aud = Array.isArray(decoded.aud) ? decoded.aud[0] : (decoded.aud as string);
  return genAddressSeed(BigInt(salt), "sub", decoded.sub as string, aud).toString();
}

/** Check if the JWT is still valid (not expired) */
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

export async function initiateZkLogin(suiClient: SuiClient): Promise<void> {
  if (!GOOGLE_CLIENT_ID) throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");

  const { epoch } = await suiClient.getLatestSuiSystemState();
  const maxEpoch = Number(epoch) + MAX_EPOCH_DURATION;

  const ephemeralKeyPair = new Ed25519Keypair();
  const randomness = generateRandomness();
  const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);

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

  const decoded = decodeJwt(jwt);
  const sub = decoded.sub as string;
  if (!sub) return null;

  const salt = getUserSalt(sub);
  const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(secretKey);
  const userAddress = jwtToAddress(jwt, salt);
  const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(ephemeralKeyPair.getPublicKey());

  const zkProof = await fetchZkProof({
    jwt,
    extendedEphemeralPublicKey,
    maxEpoch: Number(maxEpoch),
    randomness,
    salt,
  });

  const session: ZkLoginSession = {
    ephemeralKeyPair,
    randomness,
    salt,
    maxEpoch: Number(maxEpoch),
    userAddress,
    jwt,
    zkProof,
  };

  // Store everything needed to re-fetch proof if needed
  sessionStorage.setItem("zklogin_session", JSON.stringify({
    ephemeralSecret: secretKey,
    randomness,
    salt,
    maxEpoch,
    userAddress,
    jwt,
    zkProof,
  }));

  return session;
}

/**
 * Execute a transaction using zkLogin.
 * Re-fetches the ZK proof fresh each time using the same ephemeral key
 * to avoid any stale proof / keypair mismatch issues.
 */
export async function executeZkLoginTransaction(
  tx: Transaction,
  session: ZkLoginSession,
  suiClient: SuiClient,
): Promise<void> {
  // Check JWT expiry first
  if (!isJwtValid(session.jwt)) {
    throw new Error("Your Google session has expired. Please sign in with Google again.");
  }

  // Check epoch validity
  const { epoch } = await suiClient.getLatestSuiSystemState();
  if (Number(epoch) > session.maxEpoch) {
    throw new Error("Your zkLogin session has expired. Please sign in with Google again.");
  }

  tx.setSender(session.userAddress);

  const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(session.ephemeralKeyPair.getPublicKey());

  // Sign the transaction first, then fetch proof with the same inputs
  const { bytes, signature: ephemeralSig } = await tx.sign({
    client: suiClient,
    signer: session.ephemeralKeyPair,
  });

  const freshProof = await fetchZkProof({
    jwt: session.jwt,
    extendedEphemeralPublicKey,
    maxEpoch: session.maxEpoch,
    randomness: session.randomness,
    salt: session.salt,
  });

  if (!freshProof) throw new Error("Failed to get ZK proof. Please sign in again.");

  const addressSeed = computeAddressSeed(session.salt, session.jwt);

  const zkSignature = getZkLoginSignature({
    inputs: { ...freshProof, addressSeed },
    maxEpoch: session.maxEpoch,
    userSignature: ephemeralSig,
  });

  const result = await suiClient.executeTransactionBlock({
    transactionBlock: bytes,
    signature: zkSignature,
    options: { showEffects: true },
  });

  if (result.effects?.status?.status !== "success") {
    throw new Error(`Transaction failed: ${result.effects?.status?.error}`);
  }
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
      randomness: data.randomness,
      salt: data.salt,
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
  extendedEphemeralPublicKey: string;
  maxEpoch: number;
  randomness: string;
  salt: string;
}): Promise<ZkProof | null> {
  try {
    const res = await fetch(PROVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jwt: params.jwt,
        extendedEphemeralPublicKey: params.extendedEphemeralPublicKey,
        maxEpoch: params.maxEpoch,
        jwtRandomness: params.randomness,
        salt: params.salt,
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
