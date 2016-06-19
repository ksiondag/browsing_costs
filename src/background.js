'use strict';

const BREAK_TIME = 5;
const INCREMENT_TIME = 25;

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
    if (!request.earning) {
        return false;
    }

    chrome.alarms.get('moneyIncrement', function (alarm) {
        sendResponse({scheduledTime: alarm.scheduledTime});
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
            chrome.alarms.clear('moneyIncrement');
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
            return !alarm.name.includes('EndBreak');
        });

        if (createPaymentAlarm) {
            chrome.alarms.create(
                'moneyIncrement',
                {delayInMinutes: INCREMENT_TIME}
            );
        } else {
            chrome.alarms.clear('moneyIncrement');
        }
    });

};

chrome.runtime.onInstalled.addListener(function () {
    shared.get('premiumSites', (items) => {
        items.premiumSites.forEach((site) => {
            if (site.minCost === undefined) {
                site.minCost = 1;
            }
        });

        chrome.storage.sync.set(items, function () {
            console.log(items);
        });
    });

    // TODO: check all tabs for premium status
    clearOrCreatePaymentAlarm();
});

chrome.runtime.onStartup.addListener(function () {
    // TODO: check all tabs for premium status
    clearOrCreatePaymentAlarm();
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (!alarm.name.includes('EndBreak')) {
        return false;
    }

    const area = alarm.name.replace('EndBreak', '');

    shared.lock();

    clearOrCreatePaymentAlarm();

    return true;
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name !== 'moneyIncrement') {
        return false;
    }

    shared.get('money', (items) => {
        chrome.storage.sync.set({money: items.money + 1});
        chrome.alarms.create('moneyIncrement', {delayInMinutes: INCREMENT_TIME});
    });

    return true;
});

