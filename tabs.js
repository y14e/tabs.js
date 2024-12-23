// uuid [20241222]
const getUUID = () => {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : URL.createObjectURL(new Blob()).slice(-36);
};

// tabs [20241222a]
const initializeTabs = a => {
  const b = ':not(:scope [data-tabs] *)';
  const c = a.querySelectorAll(`[role="tabpanel"]${b}`);
  a.querySelector('[role="tablist"]').querySelectorAll('[role="tab"]').forEach((a, i) => {
    c[i].setAttribute('aria-labelledby', `${c[i].getAttribute('aria-labelledby') || ''} ${a.id = a.id || 'tab-' + getUUID()}`.trim());
  });
  a.querySelectorAll(`[role="tablist"]${b}`).forEach((a, i) => {
    const b = a.querySelectorAll('[role="tab"]');
    b.forEach(d => {
      d.addEventListener('click', () => {
        const e = d.getAttribute('aria-controls');
        [...document.querySelectorAll(`[aria-controls="${e}"]`)].flatMap(a => {
          return [...a.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
        }).forEach(a => {
          const b = a.getAttribute('aria-controls') === e;
          a.ariaSelected = b;
          if (b) {
            a.removeAttribute('tabindex');
          } else {
            a.tabIndex = -1;
          }
        });
        [...c].forEach(a => {
          if (a.id === e) {
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
        j.click();
      });
      d.type = 'button';
      if (d.ariaSelected !== 'true') {
        d.tabIndex = -1;
      }
    });
    //* Optional
    if (i > 0) {
      a.ariaHidden = true;
    }
    //*/
  });
  c.forEach((c, i) => {
    [...a.querySelectorAll(`[role="tab"]${b}`)].filter(a => {
      return [...a.parentElement.children].indexOf(a) === i;
    }).forEach(a => {
      a.setAttribute('aria-controls', c.id = c.id || `tab-panel-${getUUID()}`);
    });
    c.addEventListener('beforematch', a => {
      document.querySelector(`[aria-controls="${a.target.id}"]`).click();
    });
    if (!c.hidden) {
      c.tabIndex = 0;
    }
  });
};
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-tabs]').forEach(a => {
    initializeTabs(a);
  });
});