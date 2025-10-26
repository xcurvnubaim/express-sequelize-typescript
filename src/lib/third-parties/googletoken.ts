import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose';

const SECURETOKEN_JWKS = createRemoteJWKSet(
  // JWKS endpoint equivalent to the x509 list from the docs
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
  )
);

export interface FirebaseIdPayload extends JWTPayload {
  iss: string; // https://securetoken.google.com/<projectId>
  aud: string; // <projectId>
  sub: string; // Firebase UID
  auth_time?: number; // seconds since epoch
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

/**
 * Verifies a Firebase ID token with a third-party library (no firebase-admin).
 * @param idToken The JWT from the frontend (Firebase ID token)
 * @param projectId Your Firebase project ID (the one shown in Firebase Console URL)
 */
export async function verifyFirebaseIdToken(
  idToken: string,
  projectId: string
): Promise<FirebaseIdPayload> {
  // jose will fetch the JWKS, pick by `kid`, verify RS256 signature, and cache keys.
  const { payload } = await jwtVerify(idToken, SECURETOKEN_JWKS, {
    algorithms: ['RS256'], // header.alg MUST be RS256
    issuer: `https://securetoken.google.com/${projectId}`, // iss constraint
    audience: projectId, // aud constraint
    clockTolerance: '5s', // small skew allowance
  });

  // Extra checks matching Firebase guidance:
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error("Invalid 'sub' (must be non-empty string).");
  }
  if (typeof payload.auth_time === 'number') {
    const now = Math.floor(Date.now() / 1000);
    if (payload.auth_time > now + 5) {
      throw new Error("Invalid 'auth_time' (in the future).");
    }
  }

  // All good — payload is the verified identity; use `sub` as stable UID
  return payload as FirebaseIdPayload;
}
