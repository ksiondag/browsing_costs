"use strict";

// TODO: put variables in a sharable space
// NOTE: variable present in ../background.js
const CURRENCY_GAIN = 'moneyIncrement';

mocha.setup('bdd')
let expect = chai.expect;

let backup = {};

const catchError = function (done, callback) {
    try {
        callback();
    } catch (e) {
        return done(e);
    }
};

describe('Browsing Costs', function () {
    before(function (done) {
        storage.get(null, (items) => {
            backup.items = items;

            chrome.alarms.getAll((alarms) => {
                backup.alarms = alarms;

                chrome.alarms.clearAll(() => {
                    done();
                });
            });
        });
    });

    beforeEach(function (done) {
        storage.clear(() => {
            update.version(() => {
                done();
            });
        });
    });

    afterEach(function (done) {
        storage.clear(() => {
            done();
        });
    });

    after(function (done) {
        setTimeout(() => {
            storage.set(backup.items, () => {
                storage.get(null, (items) => {
                    
                    backup.alarms.forEach((alarm) => {
                        if (alarm.scheduledTime < Date.now()) {
                            if (alarm.name !== CURRENCY_GAIN) {
                                return;
                            }

                            chrome.alarms.create(
                                alarm.name,
                                {delayInMinutes: 1}
                            );
                            return;
                        }
                        // Scheduled alarm time is less than a minute away...
                        if (alarm.scheduledTime < Date.now() + 60*1000) {
                            // Alarms set less than a minute away bad
                            // Make it a full minute
                            chrome.alarms.create(
                                alarm.name,
                                {delayInMinutes: 1}
                            );
                            return;
                        }

                        // Set alarm back at original scheduled time
                        chrome.alarms.create(
                            alarm.name,
                            {when: alarm.scheduledTime}
                        );
                    });

                    done();
                });
            });
        }, 250);
    });

    it('migrates storage to local when updating to 0.1.3', function (done) {
        storage.clear(() => {
            chrome.storage.sync.set({money: -100}, () => {
                update.version(() => {
                    chrome.storage.local.get(null, (items) => {
                        catchError(done, () => {
                            expect(items.money).to.equal(-100);
                            chrome.storage.sync.clear(done);
                        });
                    });
                });
            });
        });
    });

    it('should automatically update to most-recent version', function (done) {
        storage.clear(() => {
            update.version(function () {
                storage.get('version', (items) => {
                    catchError(done, function () {
                        expect(items.version).to.equal('0.1.2');
                        done();
                    });
                });
            });
        });
    });

    it('adding sites should earn currency', function (done) {
        storage.newSite('example.com', () => {
            storage.get(null, (items) => {
                catchError(done, function () {
                    expect(items.premiumSites[0].url).to.equal('example.com');
                    expect(items.money).to.equal(1);
                    done();
                });
            });
        });
    });

    it('removing sites should cost currency', function (done) {
        storage.newSite('example.com', () => {
            storage.removeSite('example.com', () => {
                storage.get(null, (items) => {
                    catchError(done, function () {
                        expect(items.premiumSites).to.have.lengthOf(0);
                        expect(items.money).to.equal(0);
                        done();
                    });
                });
            });
        });
    });

    it('gains currency at exponentially decaying rate', function (done) {
        // TODO:
        // have alarm trigger multiple times
        // check that each trigger causes wait until next one to halve
        // until the wait is consistently 30 minutes
        // Right now, test only tests that after first trigger,
        // second alarm is aprox 4 hours away
        // Good enough for now

        const alarmCheck = function (alarm) {
            if (alarm.name !== CURRENCY_GAIN) {
                return false;
            }

            chrome.alarms.onAlarm.removeListener(alarmCheck);

            setTimeout(() => {
                chrome.alarms.get(alarm.name, (newAlarm) => {
                    let timeDiff = newAlarm.scheduledTime - alarm.scheduledTime;
                    const hours = 60*60*1000;

                    catchError(done, () => {
                        expect(timeDiff).to.be.within(3.9*hours, 4.1*hours);
                    });
                    done();
                });
            }, 100);

            return true;
        };

        chrome.alarms.onAlarm.addListener(alarmCheck);

        chrome.alarms.create(CURRENCY_GAIN, {when: Date.now() + 500});
    });

    it('break cost increases by multiples of min-cost', function (done) {
        storage.newSite('example.com', () => {
            chrome.runtime.sendMessage({cost: 1, url: 'example.com'}, () => {
                chrome.runtime.sendMessage(
                    {
                        siteState: true,
                        url: 'example.com'
                    },
                    (response) => {
                        catchError(done, () => {
                            expect(response.url).to.equal('example.com');
                            expect(response.cost).to.equal(2);
                            done();
                        });
                    }
                );
            });
        });
    });

    it('break cost decrases after currency gain', function (done) {
        const alarmCheck = function (alarm) {
            if (alarm.name !== CURRENCY_GAIN) {
                return false;
            }

            chrome.alarms.onAlarm.removeListener(alarmCheck);

            setTimeout(() => {
                storage.get('premiumSites', (items) => {
                    const example = items.premiumSites[0];

                    catchError(done, () => {
                        expect(example.url).to.equal('example.com');
                        expect(example.multiplier).to.equal(1);
                        done();
                    });
                });
            }, 100);

            return true;
        };

        chrome.alarms.onAlarm.addListener(alarmCheck);

        storage.newSite('example.com', () => {
            console.log('example.com added');
            chrome.runtime.sendMessage({cost: 1, url: 'example.com'}, () => {
                console.log('Payment made');
                chrome.alarms.create(CURRENCY_GAIN, {when: Date.now() + 500});
            });
        });

    });

    // TODO: before closing issue1
    it('should handle basic sync setup');

    // issue14
    it('should merge sync and local when sync changes');
    it('should save alarms in storage for sync purposes');

    it('should update browser icon badge when money changes');

    // Someday/Maybe
    it('should detect cheating');

    // TODO:
    // A sanity-check for the alarm-based tests if this fails all other
    // alarms-based tests will fail
    it('alarms should be functional');

});

mocha.checkLeaks();
mocha.globals(['AppView', 'ExtensionOptions', 'ExtensionView', 'WebView']);
mocha.run();

