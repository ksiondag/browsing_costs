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
            return;
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
                initialize[key] = initialState[key];
            });
            chrome.storage.sync.set(initialize, function () {
                initId(items.premiumSites, callback);
            });
        });
    };

    return {
        newSite (siteUrl, callback) {
            if (!callback) {
                callback = () => null;
            }

            this.get(localKeys, (items) => {
                let exists = items.premiumSites.some((site) => {
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
                chrome.storage.sync.set({money: items.money + 1});

                callback();
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
        }
    };
})();

