import { useRef } from 'react';
import * as Sentry from '@sentry/nextjs';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';

import { ENDPOINTS } from '@/api/config/endpoint';
import { API_BASE_URL } from '@/config/env';
import { useParseSnackbarStore } from '@/stores/parseSnackbarStore';

interface ParseSSECallbacks {
  // 개별 파일 파싱 성공 시 호출 (image: fileKey 매칭 처리용)
  onFileComplete?: (fileKey: string) => void;
  // 개별 파일 파싱 실패 시 호출 (image: 해당 아이템 ERROR 처리용)
  onFileFailed?: (fileKey: string) => void;
  // 전체 완료(100%) + 하나 이상 성공 시 호출
  onComplete?: () => void;
  // SSE 연결 에러 또는 전체 실패(100% + 성공 0건) 시 호출
  onError?: () => void;
}

const PARSE_ERROR_MESSAGE_BY_CODE: Record<string, string> = {
  '429_TEMP_EXPENSE_PARSE_RATE_LIMIT':
    '지금 분석 요청이 많아 완료하지 못했어요. 잠시 후 다시 시도해주세요.',
  TEMP_EXPENSE_PARSE_RATE_LIMIT:
    '지금 분석 요청이 많아 완료하지 못했어요. 잠시 후 다시 시도해주세요.',
  FAILED_TOO_MANY_REQUEST:
    '지금 분석 요청이 많아 완료하지 못했어요. 잠시 후 다시 시도해주세요.',
  '408_TEMP_EXPENSE_PARSE_TIMEOUT':
    '분석이 예상보다 오래 걸려 중단됐어요. 잠시 후 다시 시도해주세요.',
  TEMP_EXPENSE_PARSE_TIMEOUT:
    '분석이 예상보다 오래 걸려 중단됐어요. 잠시 후 다시 시도해주세요.',
  FAILED_TIMEOUT:
    '분석이 예상보다 오래 걸려 중단됐어요. 잠시 후 다시 시도해주세요.',
  '503_TEMP_EXPENSE_PARSE_SERVICE_UNAVAILABLE':
    '분석 서버가 일시적으로 혼잡해요. 잠시 후 다시 시도해주세요.',
  TEMP_EXPENSE_PARSE_SERVICE_UNAVAILABLE:
    '분석 서버가 일시적으로 혼잡해요. 잠시 후 다시 시도해주세요.',
  SERVICE_UNAVAILABLE:
    '분석 서버가 일시적으로 혼잡해요. 잠시 후 다시 시도해주세요.',
  INTERNAL_SERVER_ERROR: '분석을 완료하지 못했어요. 잠시 후 다시 시도해주세요.',
};

const DEFAULT_PARSE_ERROR_MESSAGE =
  '분석을 완료하지 못했어요. 잠시 후 다시 시도해주세요.';

const getParseErrorMessage = (code?: string) => {
  if (!code) return DEFAULT_PARSE_ERROR_MESSAGE;
  return PARSE_ERROR_MESSAGE_BY_CODE[code] ?? DEFAULT_PARSE_ERROR_MESSAGE;
};

export const useParseSSE = (accountBookId: number) => {
  const { addSnackbar, updateSnackbar, closeSnackbar, resetAll } =
    useParseSnackbarStore(
      useShallow((state) => ({
        addSnackbar: state.addSnackbar,
        updateSnackbar: state.updateSnackbar,
        closeSnackbar: state.closeSnackbar,
        resetAll: state.resetAll,
      })),
    );

  const eventSourcesRef = useRef<Record<string, EventSource>>({});
  const completedRef = useRef<Record<string, boolean>>({});
  const successCountRef = useRef<Record<string, number>>({});
  const reconnectAttemptsRef = useRef<Record<string, number>>({});
  const connectionStartedAtRef = useRef<Record<string, number>>({});

  const disconnect = (taskId: string) => {
    const es = eventSourcesRef.current[taskId];
    if (es) {
      es.close();
      delete eventSourcesRef.current[taskId];
    }
    delete successCountRef.current[taskId];
    delete reconnectAttemptsRef.current[taskId];
    delete connectionStartedAtRef.current[taskId];
  };

  const disconnectAll = () => {
    Object.keys(eventSourcesRef.current).forEach(disconnect);
  };

  const connect = (
    taskId: string,
    metaId: number,
    parseType: 'file' | 'image',
    callbacks?: ParseSSECallbacks,
  ) => {
    const baseUrl = API_BASE_URL?.replace(/\/$/, '');
    if (!baseUrl) return;

    const endpoint = ENDPOINTS.TEMPORARY_EXPENSES.PARSE_STATUS(
      accountBookId,
      taskId,
    );
    const eventSource = new EventSource(`${baseUrl}/${endpoint}`, {
      withCredentials: true,
    });

    eventSourcesRef.current[taskId] = eventSource;
    successCountRef.current[taskId] = 0;
    reconnectAttemptsRef.current[taskId] = 0;
    connectionStartedAtRef.current[taskId] = Date.now();
    completedRef.current[taskId] = false;

    addSnackbar({
      id: taskId,
      status: 'loading',
      description: '0%',
      parseType,
      accountBookId,
    });

    const handleProgressValue = (data: {
      progress?: number;
      fileKey?: string;
      code?: string;
    }) => {
      const { progress, fileKey, code } = data;
      if (typeof progress !== 'number') return;

      const normalizedProgress = Math.max(0, Math.min(100, progress));

      // 개별 파일 성공
      if (fileKey && code === 'SUCCESS') {
        successCountRef.current[taskId] =
          (successCountRef.current[taskId] ?? 0) + 1;
        callbacks?.onFileComplete?.(fileKey);
      }

      // 개별 파일 실패
      if (fileKey && code !== 'SUCCESS' && code != null) {
        callbacks?.onFileFailed?.(fileKey);
      }

      // 전체 완료 (100%)
      if (normalizedProgress >= 100) {
        if (completedRef.current[taskId]) return;
        completedRef.current[taskId] = true;

        const hasAnySuccess = (successCountRef.current[taskId] ?? 0) > 0;

        if (hasAnySuccess) {
          updateSnackbar(taskId, {
            status: 'success',
            description: '100%',
            parsedMetaId: metaId,
          });
          callbacks?.onComplete?.();
        } else {
          closeSnackbar(taskId);
          toast.error(getParseErrorMessage(code));
          callbacks?.onError?.();
        }

        disconnect(taskId);
        return;
      }

      // 진행률 업데이트
      updateSnackbar(taskId, {
        status: 'loading',
        description: `${normalizedProgress}%`,
      });
    };

    const handleSseEvent = (event: Event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent).data);
        reconnectAttemptsRef.current[taskId] = 0;
        handleProgressValue(parsed);
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            parseType,
            sseReadyState: eventSource.readyState,
          },
          extra: {
            taskId,
            accountBookId,
            elapsedMs: Date.now() - connectionStartedAtRef.current[taskId],
            reconnectAttempts: reconnectAttemptsRef.current[taskId] ?? 0,
          },
        });
        toast.error(
          '분석 진행 상태를 가져오는 중 문제가 발생했어요. 다시 시도해주세요.',
        );
        closeSnackbar(taskId);
        callbacks?.onError?.();
        disconnect(taskId);
      }
    };

    const handleServerError = (event: Event) => {
      if (!('data' in event)) return;

      try {
        const parsed = JSON.parse((event as MessageEvent).data) as {
          message?: string;
          code?: string;
          status?: number;
          lastCode?: string;
          lastFileKey?: string;
        };

        completedRef.current[taskId] = true;
        reconnectAttemptsRef.current[taskId] = 0;

        if (parsed.lastFileKey && parsed.lastCode !== 'SUCCESS') {
          callbacks?.onFileFailed?.(parsed.lastFileKey);
        }

        Sentry.addBreadcrumb({
          category: 'sse.parse',
          level: 'info',
          message: 'Server sent parsing error event',
          data: {
            taskId,
            accountBookId,
            parseType,
            code: parsed.code,
            status: parsed.status,
            lastCode: parsed.lastCode,
            lastFileKey: parsed.lastFileKey,
            elapsedMs: Date.now() - connectionStartedAtRef.current[taskId],
          },
        });

        toast.error(getParseErrorMessage(parsed.code));
        closeSnackbar(taskId);
        callbacks?.onError?.();
        disconnect(taskId);
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            parseType,
            sseReadyState: eventSource.readyState,
          },
          extra: {
            taskId,
            accountBookId,
            elapsedMs: Date.now() - connectionStartedAtRef.current[taskId],
            reconnectAttempts: reconnectAttemptsRef.current[taskId] ?? 0,
          },
        });
        toast.error(
          '분석 진행 상태를 가져오는 중 문제가 발생했어요. 다시 시도해주세요.',
        );
        closeSnackbar(taskId);
        callbacks?.onError?.();
        disconnect(taskId);
      }
    };

    eventSource.addEventListener('progress', handleSseEvent);
    eventSource.addEventListener('complete', handleSseEvent);
    eventSource.addEventListener('error', handleServerError);

    eventSource.onerror = () => {
      if (completedRef.current[taskId]) {
        disconnect(taskId);
        return;
      }

      const reconnectAttempts = (reconnectAttemptsRef.current[taskId] ?? 0) + 1;
      reconnectAttemptsRef.current[taskId] = reconnectAttempts;

      if (
        eventSource.readyState === EventSource.CONNECTING &&
        reconnectAttempts < 3
      ) {
        return;
      }

      if (
        eventSource.readyState === EventSource.CLOSED ||
        reconnectAttempts >= 3
      ) {
        Sentry.captureException(new Error('SSE connection error'), {
          tags: {
            parseType,
            sseReadyState: eventSource.readyState,
          },
          extra: {
            taskId,
            accountBookId,
            elapsedMs: Date.now() - connectionStartedAtRef.current[taskId],
            reconnectAttempts,
          },
        });
        toast.error(
          '분석 중 연결이 끊겼어요. 네트워크를 확인하고 다시 시도해주세요.',
        );
        closeSnackbar(taskId);
        callbacks?.onError?.();
        disconnect(taskId);
      }
    };
  };

  return {
    connect,
    disconnect,
    disconnectAll,
    closeSnackbar,
    resetParseState: resetAll,
  };
};
