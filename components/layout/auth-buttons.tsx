import Link from "next/link";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/auth/logout-button";

interface AuthButtonsProps {
  user?: any;
  isMobile?: boolean;
  onClick?: () => void;
}

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
