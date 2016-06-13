'use strict';

const shared = (() => {
    let id;

    const initialState = {
        'premiumSites': [],
        'money': 0
    };

    const localKeys = Object.keys(initialState);

    const initId = function (premiumSites, callback) {
        if (!callback) {
            callback = () => null;
        }

        if (premiumSites.length === 0) {
            id = 1;
            return callback();
        }
        id = premiumSites.slice(-1)[0].id + 1;
        callback();
    };

    const initialize = function (callback) {
        if (!callback) {
            callback = () => null;
        }

        chrome.storage.sync.get(localKeys, (items) => {
            let initialize = {};
            localKeys.forEach((key) => {
                if (items[key] !== undefined) {
                    return;
                }
                items[key] = initialState[key];
                initialize[key] = initialState[key];
            });
            chrome.storage.sync.set(initialize, function () {
                initId(items.premiumSites, callback);
            });
        });
    };

    const host = function (url) {
        const pathArray = url.split('/');
        const host = pathArray[2];
        return host;
    };

    return {
        newSite (siteUrl, callback) {
            if (!callback) {
                callback = () => null;
            }

            this.get(localKeys, (items) => {
                const exists = items.premiumSites.some((site) => {
                    return site.url === siteUrl;
                });

                if (exists) {
                    return callback();
                }

                let siteId = id;
                id += 1;
                let updatedSites = items.premiumSites.slice();
                updatedSites.push({id: siteId, url: siteUrl});

                chrome.storage.sync.set({premiumSites: updatedSites});

                // TODO:
                // This is a proof of implementation
                // Remove/update with new money system
                chrome.storage.sync.set({money: items.money + 1}, callback);
            });
        },
        removeSite (siteUrl, callback) {
            if (!callback) {
                callback = () => null;
            }

            this.get(localKeys, (items) => {
                const removeIndex =  items.premiumSites.findIndex((site) => {
                    return site.url === siteUrl;
                });

                if (removeIndex === -1) {
                    return callback();
                }

                let updatedSites = items.premiumSites.slice();
                updatedSites.splice(removeIndex, 1);

                chrome.storage.sync.set({premiumSites: updatedSites});

                // TODO:
                // This is a proof of implementation
                // Remove/update with new money system
                chrome.storage.sync.set({money: items.money - 1}, callback);
            });
        },
        get (keys, callback) {
            initialize(() => {
                chrome.storage.sync.get(keys, callback);
            });
        },
        onChanged (callback) {
            chrome.storage.onChanged.addListener((changes, areaName) => {
                if (areaName !== 'sync') {
                    return;
                }
                callback(changes);
            });
        },
        getCurrentTabHost (callback) {
            const queryInfo = {
                active: true,
                currentWindow: true
            };

            chrome.tabs.query(queryInfo, function(tabs) {
                const tab = tabs[0];
                const url = tab.url;
                console.assert(
                    typeof url === 'string',
                    'tab.url should be a string'
                );

                callback(host(url));
            });
        }
    };
})();

shared.get('money', (items) => {
    const moneyText = function (money) {
        chrome.browserAction.setBadgeText({text: '' + money});
    };
    moneyText(items.money);
    shared.onChanged(() => {
        shared.get(null, (items) => {
            moneyText(items.money);
        });
    });
});

