"use strict";

const update = (() => {
    const update_to_version_0_1_1 = function (callback) {
        storage.get(['version', 'premiumSites'], (items) => {
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

            storage.set(items, function () {
                if (callback) {
                    callback();
                }
            });
        });
    };

    const update_to_version_0_1_2 = function (callback) {
        update_to_version_0_1_1(function () {
            storage.get(['version', 'premiumSites'], (items) => {
                if (items.version >= '0.1.2') {
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

                storage.set(items, function () {
                    console.log(items);
                    if (callback) {
                        callback();
                    }
                });
            });
        });
    };

    const migrate_sync_to_local = function (callback) {
        if (!callback) {
            callback = () => null;
        }

        storage.get(null, (items) => {
            if (items.version >= '0.1.3') {
                callback();
                return;
            }

            chrome.storage.sync.get(null, (items) => {
                chrome.storage.local.set(items, function () {
                    update_to_version_0_1_2(callback);
                });
            });
        });
    };

    const update_to_version_0_1_3 = function (callback) {
        if (!callback) {
            callback = () => null;
        }

        migrate_sync_to_local(function () {
            storage.get(['version', 'premiumSites'], (items) => {
                // TODO: >= when 0.1.3 is done
                if (items.version > '0.1.3') {
                    callback();
                    return;
                }

                items.premiumSites.forEach((site) => {
                });

                items.version = '0.1.3';

                storage.set(items, function () {
                    console.log(items);
                    callback();
                });
            });
        });
    };

    return {
        version: update_to_version_0_1_3
    };
})();

