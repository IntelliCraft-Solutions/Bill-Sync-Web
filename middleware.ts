import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
    const isCashierPage = req.nextUrl.pathname.startsWith("/cashier");

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      return null;
    }

    if (!isAuth && (isAdminPage || isCashierPage)) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/auth/signin?from=${encodeURIComponent(from)}`, req.url)
      );
    }

    // Role-based protection
    if (isAdminPage && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/cashier/dashboard", req.url));
    }

    if (isCashierPage && token?.role !== "CASHIER" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  },
  {
    callbacks: {
      async authorized() {
        // This is a work-around to handle redirect logic in the middleware function above
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/cashier/:path*", "/auth/:path*"],
};
