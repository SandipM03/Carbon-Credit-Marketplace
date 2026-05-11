import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Role = "farmer" | "buyer" | "admin";

type GuardConfig = {
  pathPrefix: string;
  role: Role;
};

const guards: GuardConfig[] = [
  { pathPrefix: "/farmer", role: "farmer" },
  { pathPrefix: "/buyer", role: "buyer" },
  { pathPrefix: "/admin", role: "admin" },
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const guard = guards.find((item) => pathname.startsWith(item.pathPrefix));

  if (!guard) {
    return NextResponse.next();
  }

  const role = request.cookies.get("gc_role")?.value as Role | undefined;
  const userId = request.cookies.get("gc_user")?.value;

  if (!role || !userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (role === guard.role) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/farmer/:path*", "/buyer/:path*", "/admin/:path*"],
};
