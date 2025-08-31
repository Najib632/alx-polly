"use client";

import { useTransition } from "react";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button"; // Assuming you want to use your Button component

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      onClick={() => {
        startTransition(async () => {
          await logout();
        });
      }}
      disabled={isPending}
      className="w-full justify-start text-left" // Style for a simple button in a nav
    >
      {isPending ? "Logging out..." : "Logout"}
    </Button>
  );
}
