
const STATE = {};
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PG_REPORT') {
    const tabId = sender.tab ? sender.tab.id : null;
    if (tabId !== null) STATE[tabId] = msg.payload;
    sendResponse({ok:true});
  }
  if (msg.type === 'PG_GET') {
    const tabId = msg.tabId;
    sendResponse({ok:true, data: STATE[tabId] || null});
  }
});
chrome.tabs.onRemoved.addListener(tabId => { delete STATE[tabId]; });
