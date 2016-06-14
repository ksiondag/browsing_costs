'use strict';

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request.checkTabUrl) {
        return false;
    }
    shared.isPremiumSite(sender.tab.url, (isPremiumSite) => {
        sendResponse({isPremiumSite: isPremiumSite});
    });
    return true;
});
