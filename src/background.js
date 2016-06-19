'use strict';

const BREAK_TIME = 5;
const BREAK_POSTFIX = 'EndBreak';

const CURRENCY_GAIN = 'moneyIncrement';

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request.checkTabUrl) {
        return false;
    }

    shared.isPremiumSite(sender.tab.url, (isPremiumSite) => {
        shared.onBreak(sender.tab.url, (onBreak) => {
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

    shared.get('premiumSites', (items) => {
        items.premiumSites.some((site) => {
            if (area.host(sender.tab.url) === site.url) {
                sendResponse({
                    url: site.url,
                    cost: site.minCost
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

    shared.get(['incrementTime', 'money'], (items) => {
        chrome.alarms.getAll((alarms) => {
            alarms = alarms.filter((alarm) => {
                if (alarm.scheduledTime >= Date.now()) {
                    return true;
                }
                if (alarm.name === CURRENCY_GAIN) {
                    // TODO:
                    // Need to calculate how much currency should have been
                    // gained between now and last alarm
                    while (alarm.scheduledTime < Date.now()) {
                        alarm.scheduledTime += items.incrementTime * 60 * 1000;
                        items.incrementTime /= 2;
                        items.money += 1;
                        if (items.incrementTime < MIN_INCREMENT_TIME) {
                            items.incrementTime = MIN_INCREMENT_TIME;
                        }
                    }

                    chrome.storage.sync.set(items, function () {
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

chrome.runtime.onMessage.addListener(function (request, sender) {
    if (!request.cost) {
        return false;
    }

    shared.get('money', (items) => {
        if (items.money < request.cost) {
            return;
        }
        items.money -= request.cost;
        chrome.storage.sync.set(items, function () {
            chrome.alarms.clear(CURRENCY_GAIN);
            chrome.alarms.create(
                area.break(sender.tab.url),
                {delayInMinutes: BREAK_TIME}
            );
            shared.unlock();
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

                shared.get('incrementTime', (items) => {
                    chrome.alarms.create(
                        CURRENCY_GAIN,
                        {delayInMinutes: items.incrementTime}
                    );
                });
            });
        } else {
            chrome.alarms.clear(CURRENCY_GAIN);
            // NOTE: Magic number set in two places
            chrome.storage.sync.set({incrementTime: MAX_INCREMENT_TIME});
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

    shared.lock();

    clearOrCreatePaymentAlarm();

    return true;
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name !== CURRENCY_GAIN) {
        return false;
    }

    shared.get(['money','incrementTime'], (items) => {
        items.money += 1;

        if (items.incrementTime > MIN_INCREMENT_TIME) {
            items.incrementTime /= 2;
        } else {
            items.incrementTime = MIN_INCREMENT_TIME;
        }

        chrome.storage.sync.set(items);

        chrome.alarms.create(
            CURRENCY_GAIN,
            {delayInMinutes: items.incrementTime}
        );
    });

    return true;
});

