import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface HotjarTestEnvironment {
  appendChild: ReturnType<typeof vi.fn>;
  getElementById: ReturnType<typeof vi.fn>;
  idleCallbacks: IdleRequestCallback[];
  pathname: string;
  requestIdleCallback: ReturnType<typeof vi.fn>;
  script: { id: string; src: string; defer: boolean };
}

const stubHotjarEnvironment = (): HotjarTestEnvironment => {
  const idleCallbacks: IdleRequestCallback[] = [];
  const script = { id: '', src: '', defer: false };
  let appendedScript: typeof script | null = null;
  const location = { pathname: '/report' };
  const appendChild = vi.fn((element: typeof script) => {
    appendedScript = element;
  });
  const getElementById = vi.fn((id: string) =>
    appendedScript?.id === id ? appendedScript : null,
  );
  const requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
    idleCallbacks.push(callback);
    return idleCallbacks.length;
  });

  vi.stubGlobal('window', {
    location,
    requestIdleCallback,
    addEventListener: vi.fn(),
  });
  vi.stubGlobal('document', {
    readyState: 'complete',
    getElementById,
    createElement: vi.fn().mockReturnValue(script),
    head: { appendChild },
  });

  return {
    appendChild,
    getElementById,
    idleCallbacks,
    get pathname() {
      return location.pathname;
    },
    set pathname(value: string) {
      location.pathname = value;
    },
    requestIdleCallback,
    script,
  };
};

describe('initHotjar', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_CONTENTSQUARE_KEY', 'test-key');
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('연속 호출에도 한 번만 예약하고 script를 한 번만 주입한다', async () => {
    const environment = stubHotjarEnvironment();
    const { initHotjar } = await import('@/lib/hotjar');

    initHotjar();
    initHotjar();

    expect(environment.requestIdleCallback).toHaveBeenCalledOnce();

    environment.idleCallbacks[0]({} as IdleDeadline);
    initHotjar();

    expect(environment.appendChild).toHaveBeenCalledOnce();
    expect(environment.script).toEqual({
      id: 'contentsquare-uxa-script',
      src: 'https://t.contentsquare.net/uxa/test-key.js',
      defer: true,
    });
    expect(environment.getElementById).toHaveBeenCalledWith(
      'contentsquare-uxa-script',
    );
    expect(environment.requestIdleCallback).toHaveBeenCalledOnce();
  });

  it('예약 뒤 공유 경로로 이동하면 주입하지 않고 일반 경로에서 재예약한다', async () => {
    const environment = stubHotjarEnvironment();
    const { initHotjar } = await import('@/lib/hotjar');

    initHotjar();
    environment.pathname = '/share';
    environment.idleCallbacks[0]({} as IdleDeadline);

    expect(environment.appendChild).not.toHaveBeenCalled();

    environment.pathname = '/report';
    initHotjar();
    expect(environment.requestIdleCallback).toHaveBeenCalledTimes(2);

    environment.idleCallbacks[1]({} as IdleDeadline);

    expect(environment.appendChild).toHaveBeenCalledOnce();
  });
});
