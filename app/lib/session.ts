export type Role = "farmer" | "buyer" | "admin";

export type SessionUser = {
  userId: string;
  role: Role;
};

export function getCookieValue(cookieName: string, source: string) {
  const rawValue = source
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.split("=")[1];

  return rawValue ? decodeURIComponent(rawValue) : undefined;
}

export function getSessionFromDocumentCookie(): SessionUser | null {
  if (typeof document === "undefined") {
    return null;
  }

  const userId = getCookieValue("gc_user", document.cookie);
  const role = getCookieValue("gc_role", document.cookie) as Role | undefined;

  if (!userId || !role) {
    return null;
  }

  return { userId, role };
}

export function setSessionCookies(userId: string, role: Role) {
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `gc_user=${encodeURIComponent(userId)}; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `gc_role=${encodeURIComponent(role)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function clearSessionCookies() {
  document.cookie = "gc_user=; path=/; max-age=0; samesite=lax";
  document.cookie = "gc_role=; path=/; max-age=0; samesite=lax";
}
