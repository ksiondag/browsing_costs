'use strict';

const MAX_INCREMENT_TIME = 8*60;
const MIN_INCREMENT_TIME = 30;

const shared = (() => {
    let id;

    const initialState = {
        'premiumSites': [],
        'money': 0,
        'incrementTime': MAX_INCREMENT_TIME,
        'version': '0.1'
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

    return {
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
        newSite (siteUrl, callback) {
            if (!callback) {
                callback = () => null;
            }

            shared.get(localKeys, (items) => {
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

                items.premiumSites.push({
                    id: siteId,
                    url: siteUrl,
                    minCost: 1
                });

                items.money += 1;

                chrome.storage.sync.set(items, callback);
            });
        },
        removeSite (siteUrl, callback) {
            if (!callback) {
                callback = () => null;
            }

            shared.get(localKeys, (items) => {
                let siteState;
                const removeIndex =  items.premiumSites.findIndex((site) => {
                    if (site.url === siteUrl) {
                        siteState = site;
                        return true;
                    }
                    return false;
                });

                if (!siteState || items.money < siteState.minCost) {
                    return callback();
                }

                items.premiumSites.splice(removeIndex, 1);
                items.money -= siteState.minCost;

                chrome.storage.sync.set(items, callback);
            });
        },
        isPremiumSite: function (url, callback) {
            shared.get('premiumSites', (items) => {
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

                callback(area.host(url));
            });
        },
        onBreak (url, callback) {
            chrome.alarms.get(area.break(url), (alarm) => {
                callback(alarm && alarm.scheduledTime - Date.now() > 1000);
            });
        },
        lock () {
            console.log('Lock');
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    shared.isPremiumSite(tab.url, (isPremiumSite) => {
                        if (!isPremiumSite) {
                            return;
                        }
                        shared.onBreak(tab.url, (onBreak) => {
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
        },
        unlock () {
            console.log('Unlock');
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    const message = {
                        unlock: true
                    };
                    shared.isPremiumSite(tab.url, (isPremiumSite) => {
                        if (!isPremiumSite) {
                            return chrome.tabs.sendMessage(tab.id, message);
                        }
                        shared.onBreak(tab.url, (onBreak) => {
                            if (!onBreak) {
                                return;
                            }
                            return chrome.tabs.sendMessage(tab.id, message);
                        });
                    });
                });
            });
        },
        increment (siteUrl) {
            shared.get(localKeys, (items) => {
                const exists = items.premiumSites.some((site) => {
                    if (site.url !== siteUrl) {
                        return false;
                    }

                    site.minCost += 1;
                    items.money += 1;
                    return true;
                });

                if (!exists) {
                    return;
                }

                chrome.storage.sync.set(items);
            });
        },
        decrement (siteUrl) {
            shared.get(localKeys, (items) => {
                if (items.money <= 0) {
                    return;
                }

                const exists = items.premiumSites.some((site) => {
                    if (site.url !== siteUrl) {
                        return false;
                    }

                    if (site.minCost <= 1) {
                        return;
                    }

                    site.minCost -= 1;
                    items.money -= 1;
                    return true;
                });

                if (!exists) {
                    return;
                }

                chrome.storage.sync.set(items);
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

