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
  initialize() {
    const id = () => {
      return Math.random().toString(16).slice(2, 8).padEnd(6, '0');
    };
    this.lists.forEach((list, i) => {
      if (this.options.avoidDuplicates && i > 0) {
        list.ariaHidden = true;
      }
      list.addEventListener('keydown', event => {
        this.keydown(event);
      });
    });
    this.tabs.forEach((tab, i) => {
      if (i < this.panels.length) {
        tab.id = tab.id || `tab-${id()}`;
      }
      tab.tabIndex = tab.ariaSelected === 'true' ? 0 : -1;
      tab.addEventListener('click', event => {
        this.click(event);
      });
    });
    this.panels.forEach((panel, i) => {
      panel.id = panel.id || `tab-panel-${id()}`;
      panel.setAttribute('aria-labelledby', `${panel.getAttribute('aria-labelledby') || ''} ${this.tabs[i].id}`.trim());
      if (panel.hidden) {
        panel.tabIndex = 0;
      }
      panel.addEventListener('beforematch', event => {
        this.beforematch(event);
      });
    });
    this.tabs.forEach((tab, i) => {
      tab.setAttribute('aria-controls', this.panels[i % this.panels.length].id);
    });
  }
  keydown(event) {
    const list = event.currentTarget;
    const horizontal = list.ariaOrientation !== 'vertical';
    const previous = `Arrow${horizontal ? 'Left' : 'Up'}`;
    const next = `Arrow${horizontal ? 'Right' : 'Down'}`;
    const { key } = event;
    if (![previous, next, 'Home', 'End'].includes(key)) {
      return;
    }
    event.preventDefault();
    const tabs = list.querySelectorAll(`${this.options.selector.tab}`);
    const index = [...tabs].indexOf(document.activeElement);
    const length = tabs.length;
    const tab = tabs[key === previous ? (index - 1 < 0 ? length - 1 : index - 1) : key === next ? (index + 1) % length : key === 'Home' ? 0 : length - 1];
    tab.focus();
    if (this.options.autoActivation) {
      tab.click();
    }
  }
  click(event) {
    event.preventDefault();
    const id = event.currentTarget.getAttribute('aria-controls');
    [...this.tabs].forEach(tab => {
      const selected = tab.getAttribute('aria-controls') === id;
      tab.ariaSelected = selected;
      tab.tabIndex = selected ? 0 : -1;
    });
    [...this.panels].forEach(panel => {
      if (panel.id === id) {
        panel.removeAttribute('hidden');
        panel.tabIndex = 0;
      } else {
        panel.hidden = 'until-found';
        panel.removeAttribute('tabindex');
      }
    });
  }
  beforematch(event) {
    document.querySelector(`[aria-controls="${event.currentTarget.id}"]`).click();
  }
}

export default Tabs;