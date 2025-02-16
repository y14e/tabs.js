class Tabs {
  constructor(element, options) {
    this.element = element;
    this.options = {
      autoActivation: true,
      avoidDuplicates: false,
      ...options,
      selector: {
        list: '[role="tablist"]',
        tab: '[role="tab"]',
        content: '[role="tablist"] + :not([role="tabpanel"])',
        panel: '[role="tabpanel"]',
        ...options?.selector,
      },
      animation: {
        crossFade: true,
        duration: 300,
        easing: 'ease',
        ...options?.animation,
      },
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.options.animation.duration = 0;
    }
    const NOT_NESTED = `:not(:scope ${this.options.selector.panel} *)`;
    this.lists = this.element.querySelectorAll(`${this.options.selector.list}${NOT_NESTED}`);
    this.tabs = this.element.querySelectorAll(`${this.options.selector.tab}${NOT_NESTED}`);
    this.content = this.element.querySelector(`${this.options.selector.content}${NOT_NESTED}`);
    this.panels = this.element.querySelectorAll(`${this.options.selector.panel}${NOT_NESTED}`);
    this.initialize();
  }

  initialize() {
    this.lists.forEach((list, i) => {
      if (this.options.avoidDuplicates && i > 0) list.setAttribute('aria-hidden', 'true');
      list.addEventListener('keydown', event => this.handleKeyDown(event));
    });
    this.tabs.forEach((tab, i) => {
      const id = Math.random().toString(36).slice(-8);
      if (i < this.panels.length) {
        tab.setAttribute('id', tab.getAttribute('id') || `tab-${id}`);
        const panel = this.panels[i];
        panel.setAttribute('id', panel.getAttribute('id') || `tab-panel-${id}`);
      }
      tab.setAttribute('aria-controls', this.panels[i % this.panels.length].getAttribute('id'));
      tab.setAttribute('tabindex', tab.getAttribute('aria-selected') === 'true' ? '0' : '-1');
      tab.addEventListener('click', event => this.handleClick(event));
    });
    this.panels.forEach((panel, i) => {
      panel.setAttribute('aria-labelledby', `${panel.getAttribute('aria-labelledby') || ''} ${this.tabs[i].getAttribute('id')}`.trim());
      if (panel.hasAttribute('hidden')) {
        panel.setAttribute('hidden', 'until-found');
        panel.setAttribute('tabindex', '0');
      }
      panel.addEventListener('beforematch', event => this.handleBeforeMatch(event));
    });

    // Fix for WebKit
    if (!['auto', '0px'].includes(window.getComputedStyle(this.content).minHeight)) {
      this.panels.forEach(panel => {
        new ResizeObserver(() => {
          if (panel.hasAttribute('hidden')) return;
          window.requestAnimationFrame(() => {
            panel.closest(this.options.selector.content).style.setProperty('height', `${panel.scrollHeight}px`);
          });
        }).observe(panel);
      });
    }
  }

  handleClick(event) {
    event.preventDefault();
    if (this.element.hasAttribute('data-tabs-animating')) return;
    this.activate(event.currentTarget);
  }

  handleKeyDown(event) {
    const list = event.currentTarget;
    const isHorizontal = list.getAttribute('aria-orientation') !== 'vertical';
    const previous = `Arrow${isHorizontal ? 'Left' : 'Up'}`;
    const next = `Arrow${isHorizontal ? 'Right' : 'Down'}`;
    const { key } = event;
    if (![' ', 'Enter', previous, next, 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    if (this.element.hasAttribute('data-tabs-animating')) return;
    const active = document.activeElement;
    if ([' ', 'Enter'].includes(key)) {
      active.click();
      return;
    }
    const tabs = list.querySelectorAll(`${this.options.selector.tab}:not(:disabled)`);
    const index = [...tabs].indexOf(active);
    const length = tabs.length;
    const tab = tabs[key === previous ? (index - 1 < 0 ? length - 1 : index - 1) : key === next ? (index + 1) % length : key === 'Home' ? 0 : length - 1];
    tab.focus();
    if (this.options.autoActivation) tab.click();
  }

  handleBeforeMatch(event) {
    document.querySelector(`[aria-controls="${event.currentTarget.getAttribute('id')}"]`).click();
  }

  activate(tab) {
    if (tab.getAttribute('aria-selected') === 'true') return;
    const element = this.element;
    element.setAttribute('data-tabs-animating', '');
    const id = tab.getAttribute('aria-controls');
    [...this.tabs].forEach(tab => {
      const isSelected = tab.getAttribute('aria-controls') === id;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
    });
    this.content.style.setProperty('overflow', 'clip');
    this.content.style.setProperty('position', 'relative');
    this.content.style.setProperty('will-change', [...new Set(window.getComputedStyle(this.content).getPropertyValue('will-change').split(',')).add('height').values()].filter(value => value !== 'auto').join(','));
    [...this.panels].forEach(panel => {
      panel.style.setProperty('position', 'absolute');
      if (!panel.hasAttribute('hidden') || panel.getAttribute('id') === id) {
        panel.style.setProperty('content-visibility', 'visible');
        panel.style.setProperty('display', 'block'); // Fix for WebKit
      }
      if (!this.options.animation.crossFade && panel.getAttribute('id') !== id) panel.style.setProperty('visibility', 'hidden');
    });
    this.content.animate({ height: [`${[...this.panels].find(panel => !panel.hasAttribute('hidden')).scrollHeight}px`, `${document.getElementById(id).scrollHeight}px`] }, { duration: this.options.animation.duration, easing: this.options.animation.easing }).addEventListener('finish', () => {
      element.removeAttribute('data-tabs-animating');
      ['height', 'overflow', 'position', 'will-change'].forEach(property => this.content.style.removeProperty(property));
      [...this.panels].forEach(panel => ['content-visibility', 'display', 'position', 'visibility'].forEach(property => panel.style.removeProperty(property)));
    });
    [...this.panels].forEach(panel => {
      if (panel.getAttribute('id') === id) {
        panel.removeAttribute('hidden');
        panel.setAttribute('tabindex', '0');
      } else {
        panel.setAttribute('hidden', 'until-found');
        panel.removeAttribute('tabindex');
      }
      if (this.options.animation.crossFade) {
        panel.style.setProperty('will-change', [...new Set(window.getComputedStyle(panel).getPropertyValue('will-change').split(',')).add('opacity').values()].filter(value => value !== 'auto').join(','));
        panel.animate({ opacity: panel.hasAttribute('hidden') ? [1, 0] : [0, 1] }, { duration: this.options.animation.duration }).addEventListener('finish', () => {
          panel.style.removeProperty('will-change');
        });
      }
    });
  }
}

export default Tabs;
