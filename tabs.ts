type TabsOptions = {
  autoActivation?: boolean;
  avoidDuplicates?: boolean;
  selector?: {
    list?: string;
    tab?: string;
    panel?: string;
  };
};

class Tabs {
  element: HTMLElement;
  options: Required<TabsOptions>;
  lists: NodeListOf<HTMLElement>;
  tabs: NodeListOf<HTMLElement>;
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
        panel: '[role="tabpanel"]',
        ...options?.selector,
      },
    };
    const NOT_NESTED = `:not(:scope ${this.options.selector.panel} *)`;
    this.lists = this.element.querySelectorAll(`${this.options.selector.list}${NOT_NESTED}`);
    this.tabs = this.element.querySelectorAll(`${this.options.selector.tab}${NOT_NESTED}`);
    this.panels = this.element.querySelectorAll(`${this.options.selector.panel}${NOT_NESTED}`);
    this.initialize();
  }

  private initialize() {
    this.lists.forEach((list, i) => {
      if (this.options.avoidDuplicates && i > 0) {
        list.ariaHidden = 'true';
      }
      list.addEventListener('keydown', event => {
        this.handleKeyDown(event);
      });
    });
    const generateId = () => {
      return Math.random().toString(36).slice(-8);
    };
    this.tabs.forEach((tab, i) => {
      if (i < this.panels.length) {
        tab.id ||= `tab-${generateId()}`;
      }
      tab.setAttribute('aria-controls', (this.panels[i % this.panels.length].id ||= `tab-panel-${generateId()}`));
      tab.tabIndex = tab.ariaSelected === 'true' ? 0 : -1;
      tab.addEventListener('click', event => {
        this.handleClick(event);
      });
    });
    this.panels.forEach((panel, i) => {
      panel.setAttribute('aria-labelledby', `${panel.getAttribute('aria-labelledby') || ''} ${this.tabs[i].id}`.trim());
      if (panel.hidden) {
        panel.tabIndex = 0;
      }
      panel.addEventListener('beforematch', event => {
        this.handleBeforeMatch(event);
      });
    });
  }

  private handleClick(event: MouseEvent) {
    event.preventDefault();
    this.activate(event.currentTarget as HTMLElement);
  }

  private handleKeyDown(event: KeyboardEvent) {
    const list = event.currentTarget as HTMLElement;
    const isHorizontal = list.ariaOrientation !== 'vertical';
    const previous = `Arrow${isHorizontal ? 'Left' : 'Up'}`;
    const next = `Arrow${isHorizontal ? 'Right' : 'Down'}`;
    const { key } = event;
    if (![' ', 'Enter', previous, next, 'Home', 'End'].includes(key)) {
      return;
    }
    event.preventDefault();
    const active = document.activeElement as HTMLElement;
    if ([' ', 'Enter'].includes(key)) {
      active.click();
      return;
    }
    const tabs = list.querySelectorAll(this.options.selector.tab!);
    const index = [...tabs].indexOf(active);
    const length = tabs.length;
    const tab = tabs[key === previous ? (index - 1 < 0 ? length - 1 : index - 1) : key === next ? (index + 1) % length : key === 'Home' ? 0 : length - 1] as HTMLElement;
    tab.focus();
    if (this.options.autoActivation) {
      tab.click();
    }
  }

  private handleBeforeMatch(event: Event) {
    (document.querySelector(`[aria-controls="${(event.currentTarget as HTMLElement).id}"]`) as HTMLElement).click();
  }

  activate(tab: HTMLElement) {
    const id = tab.getAttribute('aria-controls');
    [...this.tabs].forEach(tab => {
      const isSelected = tab.getAttribute('aria-controls') === id;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
    });
    [...this.panels].forEach(panel => {
      if (panel.id === id) {
        panel.removeAttribute('hidden');
        panel.tabIndex = 0;
      } else {
        panel.setAttribute('hidden', 'until-found');
        panel.removeAttribute('tabindex');
      }
    });
  }
}

export default Tabs;
