const MENU_SAVE_SELECTION = 'ad-spy-save-selection';
const MENU_SAVE_LINK = 'ad-spy-save-link';
const MENU_OPEN_DASHBOARD = 'ad-spy-open-dashboard';

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.warn('WL AD SPY LAB: não foi possível configurar o painel lateral.', error);
  }

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_SAVE_SELECTION, title: 'Salvar seleção no WL AD SPY LAB', contexts: ['selection'] });
    chrome.contextMenus.create({ id: MENU_SAVE_LINK, title: 'Salvar link no WL AD SPY LAB', contexts: ['link'] });
    chrome.contextMenus.create({ id: MENU_OPEN_DASHBOARD, title: 'Abrir WL AD SPY LAB — painel completo', contexts: ['action'] });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.windowId) return;

  if (info.menuItemId === MENU_SAVE_SELECTION || info.menuItemId === MENU_SAVE_LINK) {
    const capture = {
      text: (info.selectionText || '').trim(),
      pageUrl: info.menuItemId === MENU_SAVE_LINK ? (info.linkUrl || info.pageUrl || tab.url || '') : (info.pageUrl || tab.url || ''),
      sourcePageUrl: info.pageUrl || tab.url || '',
      capturedAt: new Date().toISOString()
    };
    await chrome.storage.session.set({ pendingCapture: capture });
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (error) {
      console.warn('WL AD SPY LAB: não foi possível abrir o painel lateral.', error);
    }
  }

  if (info.menuItemId === MENU_OPEN_DASHBOARD) {
    await chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/index.html') });
  }
});
