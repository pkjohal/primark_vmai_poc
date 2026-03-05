import { NavLink } from 'react-router-dom';
import { ScanBarcode, ClipboardList, BarChart3, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}

export function BottomNav() {
  const { canViewTasks, canViewDashboard, canManageUsers } = useAuth();

  const items: NavItem[] = [
    { to: '/scan', icon: ScanBarcode, label: 'Scan' },
    ...(canViewTasks ? [{ to: '/tasks', icon: ClipboardList, label: 'Tasks' }] : []),
    ...(canViewDashboard ? [{ to: '/dashboard', icon: BarChart3, label: 'Dashboard' }] : []),
    ...(canManageUsers ? [{ to: '/admin', icon: Settings, label: 'Admin' }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-grey h-16 flex items-center z-40 safe-bottom">
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors ${
              isActive ? 'text-primark-blue' : 'text-mid-grey'
            }`
          }
        >
          <item.icon size={22} />
          <span className="text-[11px] font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
