'use strict';

const MAX_INCREMENT_TIME = 8*60;
const MIN_INCREMENT_TIME = 30;

const storage = (() => {
    const initialState = {
        'premiumSites': [],
        'money': 0,
        'incrementTime': MAX_INCREMENT_TIME,
        'version': '0.1'
    };

    const localKeys = Object.keys(initialState);

    let id;
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

        chrome.storage.local.get(localKeys, (items) => {
            let initialize = {};
            localKeys.forEach((key) => {
                if (items[key] !== undefined) {
                    return;
                }
                items[key] = initialState[key];
                initialize[key] = initialState[key];
            });
            chrome.storage.local.set(initialize, function () {
                initId(items.premiumSites, callback);
            });
        });
    };

    const storage = {};

    storage.get = function (keys, callback) {
        initialize(() => {
            chrome.storage.local.get(keys, callback);
        });
    };

    storage.set = function (items, callback) {
        chrome.storage.local.set(items, callback);
    };

    storage.clear = function (callback) {
        chrome.storage.local.clear(callback);
    };

    storage.onChanged = function (callback) {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== 'local') {
                return false;
            }
            callback(changes);
            return true;
        });
    };

    const addHelper = function (items, addUrl) {
        const exists = items.premiumSites.some((site) => {
            return site.url === addUrl;
        });

        if (exists) {
            return false;
        }

        let siteId = id;
        id += 1;

        items.premiumSites.push({
            id: siteId,
            url: addUrl,
            minCost: 1,
            multiplier: 1
        });

        items.money += 1;
        return true;
    };

    storage.newSite = function (siteUrl, callback) {
        if (!callback) {
            callback = () => null;
        }

        storage.get(localKeys, (items) => {
            if (addHelper(items, siteUrl)) {
                storage.set(items, callback);
                return;
            }
            callback();
        });
    };

    const removeHelper = function (items, removeUrl) {
        let siteState;
        const removeIndex = items.premiumSites.findIndex((site) => {
            if (site.url === removeUrl) {
                siteState = site;
                return true;
            }
            return false;
        });

        if (!siteState || items.money < siteState.minCost) {
            return false;
        }

        items.premiumSites.splice(removeIndex, 1);
        items.money -= siteState.minCost;
        return true;
    };

    storage.removeSite = function (siteUrl, callback) {
        if (!callback) {
            callback = () => null;
        }

        storage.get(localKeys, (items) => {
            if (removeHelper(items, siteUrl)) {
                storage.set(items, callback);
                return;
            }
            callback();
        });
    };

    storage.isPremiumSite = function (url, callback) {
        storage.get('premiumSites', (items) => {
            let siteData;
            const isPremiumSite = items.premiumSites.some((site) => {
                if (site.url === area.host(url)) {
                    siteData = site;
                    return true;
                }
                return false;
            });
            callback(isPremiumSite, siteData);
        });
    };

    // TODO:
    // Is this the appropriate place for this functionality?
    storage.getCurrentTabHost = function (callback) {
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

            callback(area.host(url));
        });
    };

    storage.onBreak = function (url, callback) {
        chrome.alarms.get(area.break(url), (alarm) => {
            callback(alarm && alarm.scheduledTime - Date.now() > 1000);
        });
    };

    storage.lock = function () {
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
                storage.isPremiumSite(tab.url, (isPremiumSite) => {
                    if (!isPremiumSite) {
                        return;
                    }
                    storage.onBreak(tab.url, (onBreak) => {
                        if (onBreak) {
                            return;
                        }
                        const message = {
                            lock: true
                        };
                        chrome.tabs.sendMessage(tab.id, message);
                    });
                });
            });
        });
    };

    storage.unlock = function (callback) {
        if (!callback) {
            callback = () => null;
        }

        chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
                const message = {
                    unlock: true
                };
                storage.isPremiumSite(tab.url, (isPremiumSite) => {
                    if (!isPremiumSite) {
                        return chrome.tabs.sendMessage(tab.id, message);
                    }
                    storage.onBreak(tab.url, (onBreak) => {
                        if (!onBreak) {
                            return;
                        }
                        return chrome.tabs.sendMessage(tab.id, message);
                    });
                });
            });
            callback();
        });
    };

    const changeCostHelper = function (items, site, newCost) {
        if (site.minCost === newCost) {
            return false;
        }

        const diffCost = newCost - site.minCost;

        site.minCost = newCost;
        items.money += diffCost;

        return true;
    };

    storage.increment = function (siteUrl) {
        storage.get(localKeys, (items) => {
            const exists = items.premiumSites.some((site) => {
                if (site.url !== siteUrl) {
                    return false;
                }

                changeCostHelper(items, site, site.minCost + 1);
                return true;
            });

            if (!exists) {
                return;
            }

            storage.set(items);
        });
    };

    storage.decrement = function (siteUrl) {
        storage.get(localKeys, (items) => {
            if (items.money <= 0) {
                return;
            }

            const exists = items.premiumSites.some((site) => {
                if (site.url !== siteUrl) {
                    return false;
                }

                if (site.minCost <= 1) {
                    return true;
                }

                changeCostHelper(items, site, site.minCost - 1);

                return true;
            });

            if (!exists) {
                return;
            }

            storage.set(items);
        });
    };

    return storage;
})();

// TODO:
// Test this functionality and then move functionality to background
storage.get('money', (items) => {
    const moneyText = function (money) {
        chrome.browserAction.setBadgeText({text: '' + money});
    };
    moneyText(items.money);
    storage.onChanged(() => {
        storage.get(null, (items) => {
            moneyText(items.money);
        });
    });
});

