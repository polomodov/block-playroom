// Each game keeps its ordinary menu and save/restore code. Only the library owns the installation.
export function enterCollectionGame() {
  const lobby = document.getElementById('lobby');
  const arena = document.getElementById('arena');
  const home = document.querySelector('[data-collection-home]');
  function placeHomeLink() {
    const modal = document.querySelector('dialog[open]');
    if (modal) {
      if (home.parentElement !== modal) modal.append(home);
      return;
    }
    const toolbar = arena.querySelector('.arena-header, .arena-nav, .arena-bar');
    const target = arena.hidden ? lobby : toolbar;
    if (home.parentElement !== target) target.prepend(home);
  }

  const observer = new MutationObserver(placeHomeLink);
  observer.observe(arena, { attributes: true, attributeFilter: ['hidden'] });
  for (const dialog of document.querySelectorAll('dialog')) {
    observer.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  }
  placeHomeLink();

  const url = new URL(location.href);
  if (url.searchParams.get('resume') === '1') {
    url.searchParams.delete('resume');
    history.replaceState(history.state, '', url);
    // The upstream button validates the snapshot and restores the game into its paused state.
    const resume = document.getElementById('continue-saved');
    if (!resume.hidden) resume.click();
  }

  // A first visit through a bookmarked game also installs the same library worker.
  if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
    const worker = new URL('../sw.js', import.meta.url);
    navigator.serviceWorker.register(worker, { scope: new URL('.', worker).href, updateViaCache: 'none' })
      .catch(() => { /* The library menu offers download status and retry. */ });
  }
}
