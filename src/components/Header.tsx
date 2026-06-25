'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAction, PublicUser } from '@/app/actions/auth';
import {
  Dumbbell,
  Scale,
  ShoppingCart,
  BookOpen,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Settings,
  Home
} from 'lucide-react';
import styles from './Header.module.css';

interface HeaderProps {
  currentUser: PublicUser | null;
}

export default function Header({ currentUser }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logoutAction();
    router.refresh();
    router.push('/');
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const navLinks = [
    { name: 'خانه', path: '/', icon: Home },
    { name: 'فروشگاه', path: '/shop', icon: ShoppingCart },
    { name: 'ثبت اندازه‌ها', path: '/sizes', icon: Scale },
    { name: 'برنامه ورزشی', path: '/workout', icon: Dumbbell },
    { name: 'وبلاگ تندرستی', path: '/blog', icon: BookOpen },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo Section */}
        <Link href="/" className={styles.logoSection}>
          <Dumbbell className={styles.logoIcon} size={28} />
          <span className={styles.logoText}>سِـت</span>
        </Link>

        {/* Hamburger Menu Toggle (Mobile) */}
        <button
          className={styles.mobileMenuToggle}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="منو"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

        {/* Navigation Links */}
        <nav className={`${styles.nav} ${mobileMenuOpen ? styles.navOpen : ''}`}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`${styles.navLink} ${isActive(link.path) ? styles.activeLink : ''}`}
              >
                <Icon size={18} />
                <span>{link.name}</span>
              </Link>
            );
          })}

          {/* Admin Panel Link */}
          {currentUser && currentUser.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`${styles.navLink} ${isActive('/admin') ? styles.activeLink : ''}`}
            >
              <Settings size={18} />
              <span>پنل مدیریت</span>
            </Link>
          )}

          {/* User Account / Login Section (Mobile Drawer) */}
          <div className={styles.userMenu}>
            {currentUser ? (
              <>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{currentUser.name}</span>
                  <span className={styles.userRole}>
                    {currentUser.role === 'admin' ? 'مدیر سیستم' : 'ورزشکار'}
                  </span>
                </div>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  <LogOut size={16} />
                  <span>خروج</span>
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className={styles.loginBtn}>
                <UserIcon size={16} />
                <span>ورود / ثبت‌نام</span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
