export function initHotjar() {
  const key = import.meta.env.VITE_CONTENTSQUARE_KEY;
  if (!key) return;

  const script = document.createElement('script');
  script.src = `https://t.contentsquare.net/uxa/${key}.js`;
  script.defer = true;
  document.head.appendChild(script);
}
