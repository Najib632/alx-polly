import Link from "next/link";

interface NavLink {
  name: string;
  href: string;
}

interface NavLinksProps {
  links: NavLink[];
  className?: string;
  linkClassName?: string;
  onClick?: () => void;
}

/**
 * Renders a list of navigation links.
 *
 * Renders a container div (optional `className`) and maps each entry in `links` to a Next.js `Link`
 * using `item.href` for the destination and `item.name` as the visible label and React `key`.
 * If `links` is empty the container is rendered with no link elements.
 *
 * @param links - Array of navigation items; each item should have a unique `name` used as the React `key`.
 * @param className - Optional class applied to the wrapper container.
 * @param linkClassName - Optional class applied to each rendered Link.
 * @param onClick - Optional click handler forwarded to every Link.
 *
 * @returns A React element containing the mapped navigation links.
 */
export default function NavLinks({ links, className, linkClassName, onClick }: NavLinksProps) {
  return (
    <div className={className}>
      {links.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={linkClassName}
          onClick={onClick}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}
