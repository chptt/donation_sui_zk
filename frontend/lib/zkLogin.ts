import {
  generateNonce,
  generateRandomness,
  jwtToAddress,
  decodeJwt,
  genAddressSeed,
  getZkLoginSignature,
} from "@mysten/sui/zklogin";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { PublicKey } from "@mysten/sui/cryptography";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

export const PROVER_URL = "https://prover-dev.mystenlabs.com/v1";
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
export const MAX_EPOCH_DURATION = 2;

/**
 * The Mysten prover expects extendedEphemeralPublicKey as the decimal string
 * of the big-endian integer of publicKey.toSuiBytes() (flag byte + 32 raw bytes).
 * This is the same value the nonce is computed from internally.
 * Do NOT use getExtendedEphemeralPublicKey() from the SDK — it returns a base64
 * string (toSuiPublicKey) which the prover rejects.
 */
function computeExtendedEphemeralPublicKey(publicKey: PublicKey): string {
  const suiBytes = publicKey.toSuiBytes(); // [flag, ...32 raw bytes]
  const hex = Array.from(suiBytes).map(b => b.toString(16).padStart(2, "0")).join("");
  return BigInt("0x" + hex).toString();
}

export interface ZkLoginSession {
  ephemeralKeyPair: Ed25519Keypair;
  // Store the extended public key string at creation time — never recompute from restored keypair
  extendedEphemeralPublicKey: string;
  randomness: string;
  salt: string;
  maxEpoch: number;
  userAddress: string;
  jwt: string;
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

/** Step 1: Generate nonce, store ephemeral key, redirect to Google */
export async function initiateZkLogin(suiClient: SuiClient): Promise<void> {
  if (!GOOGLE_CLIENT_ID) throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");

  const { epoch } = await suiClient.getLatestSuiSystemState();
  const maxEpoch = Number(epoch) + MAX_EPOCH_DURATION;

  const ephemeralKeyPair = new Ed25519Keypair();
  const randomness = generateRandomness();
  const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);

  // Compute and store extendedEphemeralPublicKey NOW — same instance used for nonce
  // Must be the decimal string of toSuiBytes() bigint — that's what the prover expects
  const extendedEphemeralPublicKey = computeExtendedEphemeralPublicKey(ephemeralKeyPair.getPublicKey());

  console.log("[zkLogin:init] maxEpoch:", maxEpoch);
  console.log("[zkLogin:init] randomness:", randomness);
  console.log("[zkLogin:init] nonce:", nonce);
  console.log("[zkLogin:init] extendedEphemeralPublicKey:", extendedEphemeralPublicKey);

  sessionStorage.setItem("zklogin_ephemeral_secret", ephemeralKeyPair.getSecretKey());
  sessionStorage.setItem("zklogin_randomness", randomness);
  sessionStorage.setItem("zklogin_max_epoch", String(maxEpoch));
  // Store the extended public key string — this is what the prover must use
  sessionStorage.setItem("zklogin_extended_epk", extendedEphemeralPublicKey);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: window.location.origin + "/zklogin-callback",
    response_type: "id_token",
    scope: "openid email",
    nonce,
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Step 2: Handle OAuth callback — build session using stored values */
export async function handleZkLoginCallback(): Promise<ZkLoginSession | null> {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const jwt = params.get("id_token");
  if (!jwt) return null;

  const secretKey = sessionStorage.getItem("zklogin_ephemeral_secret");
  const randomness = sessionStorage.getItem("zklogin_randomness");
  const maxEpoch = sessionStorage.getItem("zklogin_max_epoch");
  // Use the stored extended public key — NOT recomputed from restored keypair
  const extendedEphemeralPublicKey = sessionStorage.getItem("zklogin_extended_epk");

  if (!secretKey || !randomness || !maxEpoch || !extendedEphemeralPublicKey) {
    console.error("[zkLogin:callback] Missing session storage values");
    return null;
  }

  const decoded = decodeJwt(jwt);
  const sub = decoded.sub as string;
  if (!sub) return null;

  const salt = getUserSalt(sub);
  const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(secretKey);
  const userAddress = jwtToAddress(jwt, salt);

  console.log("[zkLogin:callback] sub:", sub);
  console.log("[zkLogin:callback] salt:", salt);
  console.log("[zkLogin:callback] maxEpoch:", maxEpoch);
  console.log("[zkLogin:callback] randomness:", randomness);
  console.log("[zkLogin:callback] extendedEphemeralPublicKey:", extendedEphemeralPublicKey);
  console.log("[zkLogin:callback] userAddress:", userAddress);

  const session: ZkLoginSession = {
    ephemeralKeyPair,
    extendedEphemeralPublicKey, // stored string — guaranteed same as nonce generation
    randomness,
    salt,
    maxEpoch: Number(maxEpoch),
    userAddress,
    jwt,
  };

  // Persist for page refresh recovery
  sessionStorage.setItem("zklogin_session", JSON.stringify({
    ephemeralSecret: secretKey,
    extendedEphemeralPublicKey,
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

  console.log("[zkLogin:exec] extendedEphemeralPublicKey:", session.extendedEphemeralPublicKey);
  console.log("[zkLogin:exec] maxEpoch:", session.maxEpoch);
  console.log("[zkLogin:exec] randomness:", session.randomness);
  console.log("[zkLogin:exec] salt:", session.salt);

  // Fetch proof using the STORED extended public key — same one used to generate the nonce
  const proof = await fetchZkProof({
    jwt: session.jwt,
    extendedEphemeralPublicKey: session.extendedEphemeralPublicKey,
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
      extendedEphemeralPublicKey: data.extendedEphemeralPublicKey,
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
  sessionStorage.removeItem("zklogin_extended_epk");
}

async function fetchZkProof(params: {
  jwt: string;
  extendedEphemeralPublicKey: string;
  maxEpoch: number;
  randomness: string;
  salt: string;
}): Promise<{ proofPoints: { a: string[]; b: string[][]; c: string[] }; issBase64Details: { value: string; indexMod4: number }; headerBase64: string } | null> {
  try {
    const body = {
      jwt: params.jwt,
      extendedEphemeralPublicKey: params.extendedEphemeralPublicKey,
      maxEpoch: params.maxEpoch,
      jwtRandomness: params.randomness,
      salt: params.salt,
      keyClaimName: "sub",
    };
    console.log("[zkLogin:prover] request:", JSON.stringify(body));

    const res = await fetch(PROVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[zkLogin:prover] error:", err);
      return null;
    }
    const proof = await res.json();
    console.log("[zkLogin:prover] response:", JSON.stringify(proof));
    return proof;
  } catch (err) {
    console.error("[zkLogin:prover] fetch failed:", err);
    return null;
  }
}
