export { API_BASE_URL } from '@/constants/env';

export const DEFAULT_TIMEOUT = 5000; // 5초

export const ERROR_NAMES = {
  ABORT_ERROR: 'AbortError',
  API_ERROR: 'ApiError',
  NETWORK_ERROR: 'TypeError', // fetch가 네트워크 단절 시 던지는 기본 에러명
} as const;

export type ErrorName = (typeof ERROR_NAMES)[keyof typeof ERROR_NAMES];

export const HTTP_STATUS = {
  NETWORK_ERROR: 0,
  OK: 200,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  REQUEST_TIMEOUT: 408,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  [HTTP_STATUS.UNAUTHORIZED]: '로그인이 필요하거나 세션이 만료되었습니다.',
  [HTTP_STATUS.FORBIDDEN]: '접근 권한이 없습니다.',
  [HTTP_STATUS.REQUEST_TIMEOUT]:
    '요청 시간이 초과됐어요. 네트워크 상태를 확인해주세요.',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]:
    '서버 점검 중입니다. 잠시 후 다시 시도해주세요.',
};

export function getDefaultErrorMessage(status: number): string | undefined {
  return DEFAULT_ERROR_MESSAGES[status];
}
