import type { LoginResponse } from '@/api/auth/type';
import { customFetch } from '@/api/config/client';
import { ENDPOINTS } from '@/api/config/endpoint';
import { getUser } from '@/api/users/api';
import type { User, UserStatus } from '@/api/users/type';
import { DEV_USER_ID } from '@/config/env';

const INACTIVE_USER_STATUSES: UserStatus[] = ['BANNED', 'DELETED', 'INACTIVE'];

export type AuthGuardResult =
  | { kind: 'ok'; user: User }
  | { kind: 'redirect'; to: string };

export type GuestGuardResult =
  | { kind: 'ok'; user: User | null }
  | { kind: 'redirect'; to: string };

export const logout = () => {
  return customFetch({
    endpoint: ENDPOINTS.AUTH.LOGOUT,
    options: {
      method: 'POST',
    },
  });
};

export const loginDev = (): Promise<LoginResponse> => {
  return customFetch({
    endpoint: ENDPOINTS.AUTH.LOGIN_DEV,
    params: { userId: DEV_USER_ID },
    options: {
      method: 'POST',
    },
  });
};

export const requireGuest = async (): Promise<GuestGuardResult> => {
  const user = await getUser().catch(() => null); // 에러 발생 시 비회원으로 간주

  if (!user || INACTIVE_USER_STATUSES.includes(user.status)) {
    return { kind: 'ok', user };
  }

  return {
    kind: 'redirect',
    to: user.needsOnboarding ? '/init' : '/home',
  };
};

export const requireAuth = async (): Promise<AuthGuardResult> => {
  const user = await getUser().catch(() => null);

  // 1. 비회원이거나 정지된 계정은 랜딩('/')으로 쫓아냄
  if (!user || INACTIVE_USER_STATUSES.includes(user.status)) {
    return { kind: 'redirect', to: '/' };
  }

  return { kind: 'ok', user };
};
