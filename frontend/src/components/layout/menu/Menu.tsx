import Link from 'next/link';
import { usePathname } from 'next/navigation';

import MenuItem from '@/components/layout/menu/MenuItem';

import { Icons } from '@/assets';
import { queryClient } from '@/lib/queryClient';
import { isRouteActive } from '@/lib/utils';
import { useRefreshStore } from '@/stores/refreshStore';

const menuItems = [
  { to: '/home', Icon: Icons.Home, label: '홈' },
  { to: '/travel', Icon: Icons.Travel, label: '여행' },
  { to: '/report', Icon: Icons.Analytics, label: '분석' },
] as const;

const Menu = () => {
  const pathname = usePathname();
  const triggerRefresh = useRefreshStore((s) => s.triggerRefresh);

  const isInitPath = isRouteActive(pathname, '/init');

  const handleRefreshClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    to: string,
  ) => {
    if (isRouteActive(pathname, to, true)) {
      e.preventDefault();
      void queryClient.invalidateQueries();
      triggerRefresh();
    }
  };

  return (
    <nav className="border-line-normal-normal bg-background-normal sticky top-0 bottom-0 left-0 flex w-16 flex-col items-center gap-9 border-r px-4 py-3">
      <Link
        href="/home"
        aria-label="홈으로 이동"
        onClick={(e) => handleRefreshClick(e, '/home')}
      >
        <Icons.Logo className="size-8 cursor-pointer" />
      </Link>
      {!isInitPath && (
        <div className="flex flex-col gap-6">
          {menuItems.map(({ to, Icon, label }) => (
            <Link key={to} href={to} onClick={(e) => handleRefreshClick(e, to)}>
              <MenuItem
                logo={<Icon className="size-5" />}
                label={label}
                isActive={isRouteActive(pathname, to, true)}
              />
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};
export default Menu;
