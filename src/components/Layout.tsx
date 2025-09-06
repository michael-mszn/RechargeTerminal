import { Link } from 'preact-router/match';

type LayoutProps = {
  children: preact.ComponentChildren;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div class="layout">
      <main>{children}</main>

      <nav className="navbar">
        {/* @ts-ignore */}
        <Link href="/profile" className="nav-button">Profile</Link>
        {/* @ts-ignore */}
        <Link href="/charging" className="nav-button">Charging</Link>
      </nav>
    </div>
  );
}
