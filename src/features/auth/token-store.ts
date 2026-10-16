import type { TokenPair, UserSummary } from "@/types/domain";

/**
 * Token storage policy for the admin app (decided 2026-10-16):
 * - access token: in-memory ONLY (module variable) — never localStorage.
 * - refresh token: sessionStorage — tab-scoped, cleared when the tab closes.
 * This is a deliberate upgrade over the user FE, which keeps both tokens in
 * localStorage. The cost: a full browser restart needs a fresh login if the
 * tab/session is gone; acceptable for an admin console.
 */
const REFRESH_KEY = "tidala-admin.refresh-token";
const USER_KEY = "tidala-admin.user";

let accessToken: string | null = null;
let accessTokenExpiresAt: string | null = null;

export function setTokens(tokens: TokenPair) {
  accessToken = tokens.accessToken;
  accessTokenExpiresAt = tokens.accessTokenExpiresAt;
  sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function getAccessToken() {
  return accessToken;
}

export function getAccessTokenExpiresAt() {
  return accessTokenExpiresAt;
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_KEY);
}

export function setUser(user: UserSummary) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): UserSummary | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserSummary) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  accessToken = null;
  accessTokenExpiresAt = null;
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(USER_KEY);
}
