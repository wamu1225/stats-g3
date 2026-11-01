import type React from 'react';

// 画面遷移は <a href> で出す（描画後の HTML にもリンクを残し、クローラと新しいタブで開く操作に効かせる）。
// 普通の左クリックだけ既存の SPA 遷移に回し、Ctrl/⌘・中クリックはブラウザに任せる。
export function sitePath(slug: string | null): string {
  const basePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/stats-g3/') ? '/stats-g3' : '';
  return slug ? `${basePath}/${slug}/` : `${basePath}/`;
}

export function spaClick(go: () => void) {
  return (e: React.MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go();
  };
}
