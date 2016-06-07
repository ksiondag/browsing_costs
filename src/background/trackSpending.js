"use strict";

function getCurrentTabUrl(callback) {
    // Query filter to be passed to chrome.tabs.query - see
    // https://developer.chrome.com/extensions/tabs#method-query
    let queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        let tab = tabs[0];

        let url = tab.url;
        console.assert(typeof url == 'string', 'tab.url should be a string');

        callback(url);
    });
}

chrome.tabs.onUpdated.addListener(function () {
    getCurrentTabUrl(function (url) {
        console.log(`Loaded new url: ${url}`);
    });
});

chrome.tabs.onActivated.addListener(function () {
    getCurrentTabUrl(function (url) {
        console.log(`Activated tab at: ${url}`);
    });
});

