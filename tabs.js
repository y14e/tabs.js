import { getUUID } from './uuid.js';

class Tabs {
  constructor(element, options) {
    this.element = element;
    this.options = {
      autoActivation: true,
      avoidDuplicates: false,
      ...options,
    };
    const NOT_NESTED = ':not(:scope [role="tabpanel"] *)';
    this.lists = this.element.querySelectorAll(`[role="tablist"]${NOT_NESTED}`);
    this.tabs = this.element.querySelectorAll(`[role="tab"]${NOT_NESTED}`);
    this.panels = this.element.querySelectorAll(`[role="tabpanel"]${NOT_NESTED}`);
    this.lists[0].querySelectorAll('[role="tab"]')
      .forEach((tab, index) => {
        tab.id = tab.id || `tab-${getUUID()}`;
        this.panels[index].setAttribute('aria-labelledby', `${this.panels[index].getAttribute('aria-labelledby') || ''} ${tab.id}`.trim());
      });
    this.lists
      .forEach((list, index) => {
        if (this.options.avoidDuplicates && index > 0) {
          list.ariaHidden = true;
        }
        list.addEventListener('keydown', event => {
          this.keydown(event);
        });
      });
    this.tabs
      .forEach(tab => {
        tab.tabIndex = tab.ariaSelected === 'true' ? 0 : -1;
        tab.addEventListener('click', event => {
          this.click(event);
        });
      });
    this.panels
      .forEach((panel, index) => {
        panel.id = panel.id || `tab-panel-${getUUID()}`;
        [...this.tabs]
          .filter((_, i) => i % (this.tabs.length / this.lists.length) === index)
          .forEach(tab => {
            tab.setAttribute('aria-controls', panel.id);
          });
        panel.hidden && (panel.tabIndex = 0);
        panel.addEventListener('beforematch', event => {
          this.beforematch(event);
        });
      });
  }
  keydown(event) {
    const horizontal = this.lists[0].ariaOrientation !== 'vertical';
    const previous = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const next = horizontal ? 'ArrowRight' : 'ArrowDown';
    const key = event.key;
    if (![previous, next, 'Home', 'End'].includes(key)) {
      return;
    }
    event.preventDefault();
    const tabs = event.currentTarget.querySelectorAll('[role="tab"]');
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
    [...document.querySelectorAll(`[aria-controls="${id}"]`)]
      .flatMap(tab => [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')])
      .forEach(tab => {
        const selected = tab.getAttribute('aria-controls') === id;
        tab.ariaSelected = selected;
        tab.tabIndex = selected ? 0 : -1;
      });
    [...this.panels]
      .forEach(panel => {
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