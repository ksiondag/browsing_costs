"use strict";

const update = (() => {
    const update_to_version_0_1_1 = function (callback) {
        shared.get(['version', 'premiumSites'], (items) => {
            if (items.version >= '0.1.1') {
                if (callback) {
                    callback();
                }
                return;
            }

            items.premiumSites.forEach((site) => {
                if (site.minCost === undefined) {
                    site.minCost = 1;
                }
            });

            items.version = '0.1.1';

            chrome.storage.sync.set(items, function () {
                if (callback) {
                    callback();
                }
            });
        });
    };

    const update_to_version_0_1_2 = function (callback) {
        update_to_version_0_1_1(function () {
            shared.get(['version', 'premiumSites'], (items) => {
                // TODO: when version 0.1.2 is fully implemented, make this >=
                if (items.version > '0.1.2') {
                    if (callback) {
                        callback();
                    }
                    return;
                }

                items.premiumSites.forEach((site) => {
                    if (site.multiplier === undefined) {
                        site.multiplier = 1;
                    }
                });

                items.version = '0.1.2';

                chrome.storage.sync.set(items, function () {
                    console.log(items);
                    if (callback) {
                        callback();
                    }
                });
            });
        });
    };

    return {
        version: update_to_version_0_1_2
    };
})();

