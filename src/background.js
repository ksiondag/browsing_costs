'use strict';

// TODO: separate alarm listeners from const definitions
const BREAK_TIME = 5;
const BREAK_POSTFIX = 'EndBreak';

// NOTE: variable present in test/test.js
const CURRENCY_GAIN = 'moneyIncrement';

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request.checkTabUrl) {
        return false;
    }

    storage.isPremiumSite(sender.tab.url, (isPremiumSite) => {
        storage.onBreak(sender.tab.url, (onBreak) => {
            sendResponse({
                isPremiumSite: isPremiumSite,
                onBreak: onBreak
            });
        });
    });

    return true;
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request.siteState) {
        return false;
    }

    storage.get('premiumSites', (items) => {
        items.premiumSites.some((site) => {
            if (area.host(request.url || sender.tab.url) === site.url) {
                sendResponse({
                    url: site.url,
                    cost: site.minCost * site.multiplier
                });
                return true;
            }
            return false;
        });
    });

    return true;
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request.getAlarms) {
        return false;
    }

    storage.get(['incrementTime', 'money'], (items) => {
        chrome.alarms.getAll((alarms) => {
            alarms = alarms.filter((alarm) => {
                if (alarm.scheduledTime >= Date.now()) {
                    return true;
                }
                if (alarm.name === CURRENCY_GAIN) {
                    // TODO:
                    // Call same functionality that CURRENCY_GAIN alarm
                    // listener executes
                    while (alarm.scheduledTime < Date.now()) {
                        alarm.scheduledTime += items.incrementTime * 60 * 1000;
                        items.incrementTime /= 2;
                        items.money += 1;
                        if (items.incrementTime < MIN_INCREMENT_TIME) {
                            items.incrementTime = MIN_INCREMENT_TIME;
                        }
                    }

                    storage.set(items, function () {
                        chrome.alarms.create(
                            alarm.name,
                            {when: alarm.scheduledTime}
                        );
                    });

                    return true;
                }
                chrome.alarms.clear(alarm.name);
                return false;
            });

            sendResponse({alarms: alarms});
        });
    });

    return true;
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request.cost) {
        return false;
    }

    storage.get(['money', 'premiumSites'], (items) => {
        if (items.money < request.cost) {
            return sendResponse();
        }

        const isPremiumSite = items.premiumSites.some((site) => {
            if (site.url === area.host(request.url || sender.tab.url)) {
                site.multiplier += 1;
                return true;
            }
            return false;
        });

        if (!isPremiumSite) {
            return sendResponse();;
        }

        items.money -= request.cost;
        storage.set(items, function () {
            chrome.alarms.clear(CURRENCY_GAIN);
            chrome.alarms.create(
                area.break(request.url || sender.tab.url),
                {delayInMinutes: BREAK_TIME}
            );
            storage.unlock(sendResponse);
        });
    });

    return true;
});

const clearOrCreatePaymentAlarm = function () {
    chrome.alarms.getAll((alarms) => {
        const createPaymentAlarm = alarms.every((alarm) => {
            return !alarm.name.endsWith(BREAK_POSTFIX);
        });

        if (createPaymentAlarm) {
            chrome.alarms.get(CURRENCY_GAIN, (alarm) => {
                if (alarm) {
                    return;
                }

                storage.get('incrementTime', (items) => {
                    chrome.alarms.create(
                        CURRENCY_GAIN,
                        {delayInMinutes: items.incrementTime}
                    );
                });
            });
        } else {
            chrome.alarms.clear(CURRENCY_GAIN);
            // NOTE: Magic number set in two places
            storage.set({incrementTime: MAX_INCREMENT_TIME});
        }
    });

};

chrome.runtime.onInstalled.addListener(function () {
    update.version(function () {
        // TODO: check all tabs for premium status
        clearOrCreatePaymentAlarm();
    });
                    
});

chrome.runtime.onStartup.addListener(function () {
    // TODO: check all tabs for premium status
    clearOrCreatePaymentAlarm();
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (!alarm.name.endsWith(BREAK_POSTFIX)) {
        return false;
    }

    const area = alarm.name.replace(BREAK_POSTFIX, '');

    storage.lock();

    clearOrCreatePaymentAlarm();

    return true;
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name !== CURRENCY_GAIN) {
        return false;
    }

    storage.get(['money','incrementTime', 'premiumSites'], (items) => {
        items.money += 1;

        if (items.incrementTime > MIN_INCREMENT_TIME) {
            items.incrementTime /= 2;
        } else {
            items.incrementTime = MIN_INCREMENT_TIME;
        }

        items.premiumSites.forEach((site) => {
            if (site.multiplier === 1) {
                return;
            }

            site.multiplier -= 1;
            return;
        });

        storage.set(items);

        chrome.alarms.create(
            CURRENCY_GAIN,
            {delayInMinutes: items.incrementTime}
        );
    });

    return true;
});

