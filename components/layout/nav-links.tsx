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
