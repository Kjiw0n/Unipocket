import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icons } from '@/assets';
import ProfileImage from '@/assets/images/profile.png';

const LandingHeader = () => {
  const pathname = usePathname();

  const isLoginPath = pathname.includes('/login');

  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const updateHash = () =>
      setActiveSection(window.location.hash.slice(1) || 'home');
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);
  const [isManualClick, setIsManualClick] = useState(false);

  const navItems = useMemo(
    () => [
      { id: 'home', label: '홈' },
      { id: 'features', label: '기능' },
      { id: 'preview', label: '미리보기' },
    ],
    [],
  );

  // 스크롤 감지 로직
  useEffect(() => {
    if (isLoginPath) return;

    const observerOptions = {
      root: null, // viewport 기준
      rootMargin: '-45% 0px -45% 0px', // 화면 중간에 올 때 감지하도록 마진 설정
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (isManualClick) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    // 각 섹션 요소 관찰 시작
    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [isLoginPath, navItems, isManualClick]);

  const handleTabClick = (id: string) => {
    setIsManualClick(true); // Observer 일시 중지
    setActiveSection(id); // 즉시 색상 변경

    // 스크롤이 끝날 즈음 다시 Observer를 활성화 (시간은 스크롤 속도에 맞춰 조절)
    setTimeout(() => {
      setIsManualClick(false);
    }, 800);
  };

  return (
    <nav className="border-fill-normal bg-background-alternative z-header sticky top-0 hidden items-center justify-between border-b px-8 py-3 md:flex">
      {/* 로고 영역 */}
      <Link href="/#home">
        <Icons.LogoText className="h-8 w-25" />
      </Link>

      {/* 메뉴 영역: map으로 반복 처리 */}
      {!isLoginPath && (
        <>
          <div className="body2-normal-bold flex gap-10">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={`/#${item.id}`}
                className={clsx(
                  'transition-all duration-300',
                  activeSection !== item.id && 'text-label-alternative',
                )}
                onClick={() => handleTabClick(item.id)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* 프로필 영역 */}
          <Link href="/login">
            <img
              src={ProfileImage.src}
              alt="프로필"
              className="h-8 w-8 rounded-full object-cover"
            />
          </Link>
        </>
      )}
    </nav>
  );
};

export default LandingHeader;
