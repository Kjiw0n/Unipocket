import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { loginDev } from '@/api/auth/api';
import { userKeys } from '@/api/users/query';
import { AuthLogos } from '@/assets';
import { COOKIE_DOMAIN, IS_PROD } from '@/config/env';
import { queryClient } from '@/lib/queryClient';

const LoginContainerTemp = () => {
  const router = useRouter();
  const handleOnClick = async () => {
    try {
      const { accessToken, refreshToken, expiresIn } = await loginDev();
      const baseOptions = IS_PROD
        ? `path=/; domain=${COOKIE_DOMAIN}; Secure; SameSite=None; `
        : 'path=/; SameSite=Lax; ';
      const REFRESH_EXPIRY = 30 * 24 * 60 * 60;
      document.cookie = `access_token=${accessToken}; max-age=${expiresIn}; ${baseOptions}`;
      document.cookie = `refresh_token=${refreshToken}; max-age=${REFRESH_EXPIRY}; ${baseOptions}`;
      await queryClient.invalidateQueries({ queryKey: userKeys.me() });
      router.push('/home');
    } catch {
      toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };
  return (
    <button
      onClick={handleOnClick}
      className="bg-background-normal flex cursor-pointer items-center justify-center gap-3.5 rounded-lg py-[11.5px] transition-opacity hover:opacity-80"
    >
      <AuthLogos.Guest className="text-primary-heavy size-4.5" />
      <span className="text-primary-heavy text-[15px] font-semibold">
        게스트로 로그인
      </span>
    </button>
  );
};

export default LoginContainerTemp;
