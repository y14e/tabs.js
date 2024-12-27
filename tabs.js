import { getUUID } from './uuid.js';

class Tabs {
  constructor(element, options) {
    this.element = element;
    this.defaults = {
      activation: 'automatic',
      ...options
    };
    const a = this.element;
    const b = ':not(:scope [role="tabpanel"] *)';
    const c = a.querySelectorAll(`[role="tabpanel"]${b}`);
    a.querySelector('[role="tablist"]').querySelectorAll('[role="tab"]').forEach((a, i) => {
      c[i].setAttribute('aria-labelledby', `${c[i].getAttribute('aria-labelledby') || ''} ${a.id = a.id || 'tab-' + getUUID()}`.trim());
    });
    a.querySelectorAll(`[role="tablist"]${b}`).forEach((a, i) => {
      const b = a.querySelectorAll('[role="tab"]');
      b.forEach(d => {
        d.addEventListener('click', a => {
          a.preventDefault();
          const b = d.getAttribute('aria-controls');
          [...document.querySelectorAll(`[aria-controls="${b}"]`)].flatMap(a => [...a.closest('[role="tablist"]').querySelectorAll('[role="tab"]')]).forEach(a => {
            const c = a.getAttribute('aria-controls') === b;
            a.ariaSelected = c;
            a.tabIndex = c ? 0 : -1;
          });
          [...c].forEach(a => {
            if (a.id === b) {
              a.removeAttribute('hidden');
              a.tabIndex = 0;
            } else {
              a.hidden = 'until-found';
              a.removeAttribute('tabindex');
            }
          });
        });
        d.addEventListener('keydown', c => {
          const d = a.ariaOrientation !== 'vertical';
          const e = d ? 'ArrowLeft' : 'ArrowUp';
          const f = d ? 'ArrowRight' : 'ArrowDown';
          const g = c.key;
          if (![e, f, 'Home', 'End'].includes(g)) {
            return;
          }
          c.preventDefault();
          const h = [...b].indexOf(document.activeElement);
          const i = b.length;
          const j = b[g === e ? h - 1 < 0 ? i - 1 : h - 1 : g === f ? (h + 1) % i : g === 'Home' ? 0 : i - 1];
          j.focus();
          if (this.defaults.activation !== 'manual') {
            j.click();
          }
        });
        d.tabIndex = d.ariaSelected === 'true' ? 0 : -1;
      });
      //* Optional
      if (i > 0) {
        a.ariaHidden = true;
      }
      //*/
    });
    c.forEach((c, i) => {
      [...a.querySelectorAll(`[role="tab"]${b}`)].filter(a => [...a.closest('[role="tablist"]').querySelectorAll('[role="tab"]')].indexOf(a) === i).forEach(a => {
        a.setAttribute('aria-controls', c.id = c.id || `tab-panel-${getUUID()}`);
      });
      c.addEventListener('beforematch', a => {
        document.querySelector(`[aria-controls="${a.target.id}"]`).click();
      });
      if (!c.hidden) {
        c.tabIndex = 0;
      }
    });
  }
}

export default Tabs;