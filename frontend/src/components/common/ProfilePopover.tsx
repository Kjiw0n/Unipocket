import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from '@radix-ui/react-popover';
import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Divider from '@/components/common/Divider';

import { useLogoutMutation } from '@/api/auth/query';
import { useGetUserQuery } from '@/api/users/query';
import ProfileImage from '@/assets/images/profile.png';
import { AUTH_PROVIDERS } from '@/constants/authProviders';
import { isRouteActive } from '@/lib/utils';

const ProfilePopover = () => {
  const { data } = useGetUserQuery();

  const logoutMutation = useLogoutMutation();

  const pathname = usePathname();
  const isInitPath = isRouteActive(pathname, '/init');

  const isGoogleUser = data.profileImgUrl?.includes('googleusercontent');
  const authProvider = AUTH_PROVIDERS.find(
    (p) => p.id === (isGoogleUser ? 'google' : 'kakao'),
  )!;
  const AuthIcon = authProvider.Icon;

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logoutMutation.mutate();
    return;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label="프로필 메뉴 열기">
          <img
            src={
              data.profileImgUrl
                ?.replace(/^http:\/\//, 'https://')
                // 카카오 썸네일 스펙(R640x640.q70 등)을 표시 크기에 맞는 110x110으로 교체
                .replace('640x640', '110x110') || ProfileImage.src
            }
            alt=""
            className="h-8 w-8 cursor-pointer rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="mt-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="bg-background-normal shadow-popover rounded-modal-18 flex min-w-60 flex-col gap-5 p-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              {!data.email && (
                <AuthIcon
                  className={clsx(
                    'flex size-4 items-center justify-center rounded p-0.75',
                    authProvider.bgColor,
                  )}
                />
              )}
              <span className="body2-normal-bold">{data.name}</span>
            </div>
            {data.email && (
              <div className="flex items-center gap-2.5">
                <AuthIcon
                  className={clsx(
                    'flex size-4 items-center justify-center rounded p-0.75',
                    authProvider.bgColor,
                  )}
                />
                <span className="label1-normal-medium text-label-alternative">
                  {data.email}
                </span>
              </div>
            )}
          </div>
          <Divider style={'thin'} />
          <PopoverClose asChild>
            {!isInitPath && (
              <Link
                href="/setting"
                className="body2-normal-medium text-label-alternative"
              >
                설정
              </Link>
            )}
          </PopoverClose>
          <PopoverClose asChild>
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="body2-normal-medium text-label-alternative cursor-pointer text-left"
            >
              로그아웃
            </button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProfilePopover;
