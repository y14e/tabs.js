type Props = {
  autoActivation: boolean;
  avoidDuplicates: boolean;
  selector: {
    list: string;
    tab: string;
    content: string;
    panel: string;
  };
  animation: {
    crossFade: boolean;
    duration: number;
    easing: string;
  };
};

class Tabs {
  element: HTMLElement;
  props: Props;
  lists: NodeListOf<HTMLElement>;
  tabs: NodeListOf<HTMLElement>;
  content: HTMLElement;
  panels: NodeListOf<HTMLElement>;

  constructor(element: HTMLElement, props?: Partial<Props>) {
    this.element = element;
    this.props = {
      autoActivation: true,
      avoidDuplicates: false,
      ...props,
      selector: {
        list: '[role="tablist"]',
        tab: '[role="tab"]',
        content: '[role="tablist"] + *',
        panel: '[role="tabpanel"]',
        ...props?.selector,
      },
      animation: {
        crossFade: true,
        duration: 300,
        easing: 'ease',
        ...props?.animation,
      },
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.props.animation.duration = 0;
    const NOT_NESTED = `:not(:scope ${this.props.selector.panel} *)`;
    this.lists = this.element.querySelectorAll(`${this.props.selector.list}${NOT_NESTED}`);
    this.tabs = this.element.querySelectorAll(`${this.props.selector.tab}${NOT_NESTED}`);
    this.content = this.element.querySelector(`${this.props.selector.content}${NOT_NESTED}`) as HTMLElement;
    this.panels = this.element.querySelectorAll(`${this.props.selector.panel}${NOT_NESTED}`);
    this.initialize();
  }

  private initialize(): void {
    this.lists.forEach((list, i) => {
      if (this.props.avoidDuplicates && i > 0) list.setAttribute('aria-hidden', 'true');
      list.addEventListener('keydown', event => this.handleKeyDown(event));
    });
    this.tabs.forEach((tab, i) => {
      const id = Math.random().toString(36).slice(-8);
      if (i < this.panels.length) {
        tab.setAttribute('id', tab.getAttribute('id') || `tab-${id}`);
        const panel = this.panels[i];
        panel.setAttribute('id', panel.getAttribute('id') || `tab-panel-${id}`);
      }
      tab.setAttribute('aria-controls', this.panels[i % this.panels.length].getAttribute('id')!);
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
    if (!['auto', '0px'].includes(window.getComputedStyle(this.content).getPropertyValue('min-height'))) {
      this.panels.forEach(panel => {
        new ResizeObserver(() => {
          if (panel.hasAttribute('hidden')) return;
          window.requestAnimationFrame(() => {
            (panel.closest(this.props.selector.content) as HTMLElement).style.setProperty('height', `${panel.scrollHeight}px`);
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
    const isHorizontal = list.getAttribute('aria-orientation') !== 'vertical';
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
    const tabs = list.querySelectorAll(`${this.props.selector.tab}:not(:disabled)`);
    const index = [...tabs].indexOf(active);
    const length = tabs.length;
    const tab = tabs[key === previous ? (index - 1 < 0 ? length - 1 : index - 1) : key === next ? (index + 1) % length : key === 'Home' ? 0 : length - 1] as HTMLElement;
    tab.focus();
    if (this.props.autoActivation) tab.click();
  }

  private handleBeforeMatch(event: Event): void {
    (document.querySelector(`[aria-controls="${(event.currentTarget as HTMLElement).getAttribute('id')}"]`) as HTMLElement).click();
  }

  activate(tab: HTMLElement): void {
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
      if (!this.props.animation.crossFade && panel.getAttribute('id') !== id) panel.style.setProperty('visibility', 'hidden');
    });
    this.content.animate({ height: [`${[...this.panels].find(panel => !panel.hasAttribute('hidden'))!.scrollHeight}px`, `${document.getElementById(id!)!.scrollHeight}px`] }, { duration: this.props.animation.duration, easing: this.props.animation.easing }).addEventListener('finish', () => {
      element.removeAttribute('data-tabs-animating');
      ['height', 'overflow', 'position', 'will-change'].forEach(name => this.content.style.removeProperty(name));
      [...this.panels].forEach(panel => ['content-visibility', 'display', 'position', 'visibility'].forEach(name => panel.style.removeProperty(name)));
    });
    [...this.panels].forEach(panel => {
      if (panel.getAttribute('id') === id) {
        panel.removeAttribute('hidden');
        panel.setAttribute('tabindex', '0');
      } else {
        panel.setAttribute('hidden', 'until-found');
        panel.removeAttribute('tabindex');
      }
      if (this.props.animation.crossFade) {
        panel.style.setProperty('will-change', [...new Set(window.getComputedStyle(panel).getPropertyValue('will-change').split(',')).add('opacity').values()].filter(value => value !== 'auto').join(','));
        panel.animate({ opacity: panel.hasAttribute('hidden') ? [1, 0] : [0, 1] }, { duration: this.props.animation.duration, easing: 'ease' }).addEventListener('finish', () => {
          panel.style.removeProperty('will-change');
        });
      }
    });
  }
}

export default Tabs;
