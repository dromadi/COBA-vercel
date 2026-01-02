import { SessionUser } from '@/lib/types';
import NavBar from './NavBar';
import SideMenu from './SideMenu';

export default function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return (
    <div>
      <NavBar user={user} />
      <div className="app-container page-content">
        <div className="app-shell">
          <aside className="side-menu d-none d-lg-block">
            <SideMenu user={user} />
          </aside>
          <main className="app-shell__content">{children}</main>
        </div>
      </div>
    </div>
  );
}
