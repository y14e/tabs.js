type TabsOptions = {
  autoActivation?: boolean;
  avoidDuplicates?: boolean;
  selector?: {
    list?: string;
    tab?: string;
    content?: string;
    panel?: string;
  };
  animation?: {
    crossFade?: boolean;
    duration?: number;
    easing?: string;
  };
};

class Tabs {
  element: HTMLElement;
  options: Required<TabsOptions>;
  lists: NodeListOf<HTMLElement>;
  tabs: NodeListOf<HTMLElement>;
  content: HTMLElement;
  panels: NodeListOf<HTMLElement>;

  constructor(element: HTMLElement, options?: TabsOptions) {
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
    this.content = this.element.querySelector(`${this.options.selector.content}${NOT_NESTED}`) as HTMLElement;
    this.panels = this.element.querySelectorAll(`${this.options.selector.panel}${NOT_NESTED}`);
    this.initialize();
  }

  private initialize(): void {
    this.lists.forEach((list, i) => {
      if (this.options.avoidDuplicates && i > 0) list.ariaHidden = 'true';
      list.addEventListener('keydown', event => this.handleKeyDown(event));
    });
    this.tabs.forEach((tab, i) => {
      const id = Math.random().toString(36).slice(-8);
      if (i < this.panels.length) tab.id ||= `tab-${id}`;
      tab.setAttribute('aria-controls', (this.panels[i % this.panels.length].id ||= `tab-panel-${id}`));
      tab.tabIndex = tab.ariaSelected === 'true' ? 0 : -1;
      tab.addEventListener('click', event => this.handleClick(event));
    });
    this.panels.forEach((panel, i) => {
      panel.setAttribute('aria-labelledby', `${panel.getAttribute('aria-labelledby') || ''} ${this.tabs[i].id}`.trim());
      if (panel.hidden) {
        panel.setAttribute('hidden', 'until-found');
        panel.tabIndex = 0;
      }
      panel.addEventListener('beforematch', event => this.handleBeforeMatch(event));
    });

    // Fix for WebKit
    if (!['auto', '0px'].includes(window.getComputedStyle(this.content).minHeight)) {
      this.panels.forEach(panel => {
        new ResizeObserver(() => {
          if (panel.hidden) return;
          window.requestAnimationFrame(() => {
            (panel.closest(this.options.selector.content!) as HTMLElement).style.height = `${panel.scrollHeight}px`;
          });
        }).observe(panel);
      });
    }
  }

  private handleClick(event: MouseEvent): void {
    event.preventDefault();
    if (this.element.hasAttribute('data-tabs-animating')) return;
    this.activate(event.currentTarget as HTMLElement);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const list = event.currentTarget as HTMLElement;
    const isHorizontal = list.ariaOrientation !== 'vertical';
    const previous = `Arrow${isHorizontal ? 'Left' : 'Up'}`;
    const next = `Arrow${isHorizontal ? 'Right' : 'Down'}`;
    const { key } = event;
    if (![' ', 'Enter', previous, next, 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    if (this.element.hasAttribute('data-tabs-animating')) return;
    const active = document.activeElement as HTMLElement;
    if ([' ', 'Enter'].includes(key)) {
      active.click();
      return;
    }
    const tabs = list.querySelectorAll(`${this.options.selector.tab!}:not(:disabled)`);
    const index = [...tabs].indexOf(active);
    const length = tabs.length;
    const tab = tabs[key === previous ? (index - 1 < 0 ? length - 1 : index - 1) : key === next ? (index + 1) % length : key === 'Home' ? 0 : length - 1] as HTMLElement;
    tab.focus();
    if (this.options.autoActivation) tab.click();
  }

  private handleBeforeMatch(event: Event): void {
    (document.querySelector(`[aria-controls="${(event.currentTarget as HTMLElement).id}"]`) as HTMLElement).click();
  }

  activate(tab: HTMLElement): void {
    if (tab.ariaSelected === 'true') return;
    const element = this.element;
    element.dataset.tabsAnimating = '';
    const id = tab.getAttribute('aria-controls');
    [...this.tabs].forEach(tab => {
      const isSelected = tab.getAttribute('aria-controls') === id;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
    });
    this.content.style.cssText += `
      overflow: clip;
      position: relative;
      will-change: height;
    `;
    [...this.panels].forEach(panel => {
      panel.style.position = 'absolute';
      if (!panel.hidden || panel.id === id) {
        panel.style.cssText += `
          content-visibility: visible;
          display: block; // Fix for WebKit
        `;
      }
      if (!this.options.animation.crossFade && panel.id !== id) panel.style.visibility = 'hidden';
    });
    this.content.animate({ height: [`${[...this.panels].find(panel => !panel.hasAttribute('hidden'))!.scrollHeight}px`, `${document.getElementById(id!)!.scrollHeight}px`] }, { duration: this.options.animation.duration, easing: this.options.animation.easing }).addEventListener('finish', () => {
      delete element.dataset.tabsAnimating;
      this.content.style.height = this.content.style.overflow = this.content.style.position = this.content.style.willChange = '';
      [...this.panels].forEach(panel => {
        panel.style.contentVisibility = panel.style.display = panel.style.position = panel.style.visibility = '';
      });
    });
    [...this.panels].forEach(panel => {
      if (panel.id === id) {
        panel.removeAttribute('hidden');
        panel.tabIndex = 0;
      } else {
        panel.setAttribute('hidden', 'until-found');
        panel.removeAttribute('tabindex');
      }
      if (this.options.animation.crossFade) {
        panel.style.willChange = 'opacity';
        panel.animate({ opacity: panel.hidden ? [1, 0] : [0, 1] }, { duration: this.options.animation.duration, easing: 'ease' }).addEventListener('finish', () => {
          panel.style.willChange = '';
        });
      }
    });
  }
}

export default Tabs;
