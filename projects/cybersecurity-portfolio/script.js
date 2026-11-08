'use strict';

(function initializePortfolio() {
  const menuButton = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#main-nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
      nav.classList.toggle('open', !isOpen);
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
    }));
  }

  const cards = Array.from(document.querySelectorAll('[data-categories]'));
  const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
  function applyFilter(filter) {
    cards.forEach(card => {
      const groups = (card.dataset.categories || '').split(/\s+/);
      card.hidden = filter !== 'all' && !groups.includes(filter);
    });
    filterButtons.forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  filterButtons.forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.filter)));
  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
