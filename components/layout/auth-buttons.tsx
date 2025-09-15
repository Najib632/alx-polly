import Link from "next/link";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/auth/logout-button";

interface AuthButtonsProps {
  user?: any;
  isMobile?: boolean;
  onClick?: () => void;
}

/**
 * Renders authentication UI: a greeting and logout when signed in, or Login/Sign Up links when not.
 *
 * If `user` is present, displays "Hello, <local-part>" (derived from `user.email?.split("@")[0]`) and a LogoutButton.
 * If `user` is absent, renders Login and Sign Up buttons that navigate to `/login` and `/signup`.
 * Layout and sizing switch between stacked/full-width (mobile) and inline (desktop) based on `isMobile`.
 * The optional `onClick` handler is forwarded to the Link elements for Login and Sign Up.
 *
 * @param user - Authenticated user object; only the `email` local-part is read for the greeting.
 * @param isMobile - When true, use a vertical/full-width mobile layout; otherwise use a horizontal desktop layout.
 * @param onClick - Optional click handler forwarded to the Login and Sign Up links.
 */
export default function AuthButtons({ user, isMobile, onClick }: AuthButtonsProps) {
  if (user) {
    return (
      <div className={`flex items-center ${isMobile ? "flex-col space-y-2 w-full" : "space-x-4"}`}>
        <span className={`text-sm text-muted-foreground ${isMobile ? "px-3" : ""}`}>
          Hello, {user.email?.split("@")[0]}
        </span>
        <div className={isMobile ? "w-full px-3" : ""}>
          <LogoutButton />
        </div>
      </div>
    );
  }

  return (
    <div className={isMobile ? "space-y-2" : "flex items-center space-x-2"}>
      <Button variant="ghost" size="sm" className={isMobile ? "w-full justify-start" : ""} asChild>
        <Link href="/login" onClick={onClick}>Login</Link>
      </Button>
      <Button size="sm" className={isMobile ? "w-full" : ""} asChild>
        <Link href="/signup" onClick={onClick}>Sign Up</Link>
      </Button>
    </div>
  );
}
