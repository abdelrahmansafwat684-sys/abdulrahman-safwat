'use strict';

(function initializePortfolio() {
  const menuButton = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#main-nav');
  if (menuButton && nav) {
    const closeMenu = (restoreFocus = false) => {
      const wasOpen = menuButton.getAttribute('aria-expanded') === 'true';
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
      if (restoreFocus && wasOpen) menuButton.focus();
    };
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      if (isOpen) closeMenu();
      else {
        nav.classList.add('open');
        menuButton.setAttribute('aria-expanded', 'true');
        menuButton.setAttribute('aria-label', 'Close navigation');
      }
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu(true);
    });
    document.addEventListener('click', event => {
      if (!nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 800) closeMenu();
    });
  }

  const cards = Array.from(document.querySelectorAll('[data-categories]'));
  const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
  const filterStatus = document.querySelector('#filter-status');
  function applyFilter(filter) {
    let visible = 0;
    cards.forEach(card => {
      const groups = (card.dataset.categories || '').split(/\s+/);
      card.hidden = filter !== 'all' && !groups.includes(filter);
      if (!card.hidden) visible += 1;
    });
    filterButtons.forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (filterStatus) {
      const activeName = filterButtons.find(button => button.dataset.filter === filter)?.textContent.trim().replace(/\s+\d+$/, '') || filter;
      filterStatus.textContent = filter === 'all'
        ? `Showing all ${visible} projects.`
        : `Showing ${visible} of ${cards.length} projects in ${activeName}.`;
    }
  }
  filterButtons.forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.filter)));
  document.querySelector('[data-print-sheet]')?.addEventListener('click', () => window.print());
  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
