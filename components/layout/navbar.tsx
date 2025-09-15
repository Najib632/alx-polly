"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, BarChart3 } from "lucide-react";
import NavLinks from "./nav-links";
import AuthButtons from "./auth-buttons";

interface NavbarProps {
  user?: any;
}

/**
 * Responsive top navigation bar for the app with desktop and mobile layouts.
 *
 * Renders brand logo, navigation links, and authentication controls. On small
 * screens it shows a toggleable mobile menu; when the mobile menu is open the
 * component adds `overflow-hidden` to `document.body` and removes it when the
 * menu closes or the component unmounts to prevent page scrolling.
 *
 * @param user - Optional authenticated user object used by the auth controls.
 * @returns The Navbar React element.
 */
export default function Navbar({ user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    // Cleanup function to remove the class when the component unmounts
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const navigation = [
    { name: "My Polls", href: "/polls" },
    { name: "Create Poll", href: "/polls/create" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Polly</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {/* Desktop Navigation */}
            <NavLinks
              links={navigation}
              linkClassName="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            />
            {/* Desktop Auth */}
            <AuthButtons user={user} />
          </div>


          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background pt-4 pb-4">
            <div className="px-2 space-y-4">
              <NavLinks
                links={navigation}
                className="space-y-1"
                linkClassName="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                onClick={closeMenu}
              />

              {/* Mobile Auth */}
              <div className="border-t pt-4">
                <AuthButtons user={user} isMobile onClick={closeMenu} />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
