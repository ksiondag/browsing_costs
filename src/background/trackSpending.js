'use strict';

const BREAK_TIME = 5;
const INCREMENT_TIME = 25;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request.checkTabUrl) {
        return false;
    }

    shared.isPremiumSite(sender.tab.url, (isPremiumSite) => {
        chrome.alarms.get('endBreak', (alarm) => {
            let onBreak;
            if (alarm && alarm.scheduledTime - Date.now() > 1000) {
                onBreak = true;
            } else {
                onBreak = false;
            }
            sendResponse({
                isPremiumSite: isPremiumSite,
                onBreak: onBreak
            });
        });
    });

    return true;
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (!request.spending) {
        return false;
    }

    shared.get('money', (items) => {
        if (items.money <= 0) {
            return;
        }
        chrome.storage.sync.set({money: items.money - 1}, function () {
            chrome.alarms.clear('moneyIncrement');
            chrome.alarms.create('endBreak', {delayInMinutes: BREAK_TIME});

            // TODO: decrement money
            sendResponse({success: true});
        });
    });

    return true;
});

chrome.runtime.onStartup.addListener(function () {
    // TODO: check all tabs for premium status
    chrome.alarms.create('moneyIncrement', {delayInMinutes: INCREMENT_TIME});
});

chrome.runtime.onInstalled.addListener(function () {
    // TODO: check all tabs for premium status
    chrome.alarms.create('moneyIncrement', {delayInMinutes: INCREMENT_TIME});
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name !== 'endBreak') {
        return false;
    }

    shared.paymentBlock();
    chrome.alarms.create('moneyIncrement', {delayInMinutes: INCREMENT_TIME});

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
