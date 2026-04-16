'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useAuth } from '@/components/user/AuthProvider';
import { selectCartTotalQty } from '@/app/store/reducers/CartSlice';
import type { RootState } from '@/app/store/store';

type NavItem = { href: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Главная' },
  { href: '/products', label: 'Каталог' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuth, loading, logout } = useAuth();
  const cartQty = useSelector((s: RootState) => selectCartTotalQty(s));

  const linkCls = (href: string) => {
    const active =
      href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
    return [
      'rounded-lg px-3 py-2 text-sm font-medium transition',
      active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
    ].join(' ');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold text-gray-900">
          MyShop
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls(item.href)}>
              {item.label}
            </Link>
          ))}

          <Link href="/products" className="relative rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Корзина
            {cartQty > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                {cartQty}
              </span>
            )}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-sm text-gray-400">…</span>
          ) : isAuth ? (
            <>
              <Link href="/profile" className={linkCls('/profile')}>
                Личный кабинет
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.push('/auth');
                }}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Выйти
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
