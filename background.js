// Listen for extension installation or update
chrome.runtime.onInstalled.addListener(() => {
    // Initialize any necessary storage or settings
    chrome.storage.local.set({
      isEnabled: true,
      lastUsed: new Date().toISOString()
    });
  });
  
  // Listen for messages from the popup or content scripts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fillForm") {
      // Get the active tab
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          // Send message to content script to fill the form
          chrome.tabs.sendMessage(tabs[0].id, {action: "fillForm"}, (response) => {
            sendResponse(response);
          });
        }
      });
      return true; // Will respond asynchronously
    }
  });