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
        shared.get(null, (items) => {
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
        chrome.storage.sync.clear(() => {
            done();
        });
    });

    afterEach(function (done) {
        chrome.storage.sync.clear(() => {
            done();
        });
    });

    after(function (done) {
        setTimeout(() => {
            chrome.storage.sync.set(backup.items, () => {
                shared.get(null, (items) => {
                    
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

    it('should automatically update to most-recent version', function (done) {
        update.version(function () {
            shared.get('version', (items) => {
                catchError(done, function () {
                    expect(items.version).to.equal('0.1.2');
                    done();
                });
            });
        });
    });

    it('adding sites should earn currency', function (done) {
        shared.newSite('example.com', () => {
            shared.get(null, (items) => {
                catchError(done, function () {
                    expect(items.premiumSites[0].url).to.equal('example.com');
                    expect(items.money).to.equal(1);
                    done();
                });
            });
        });
    });

    it('removing sites should cost currency', function (done) {
        shared.newSite('example.com', () => {
            shared.removeSite('example.com', () => {
                shared.get(null, (items) => {
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

        this.timeout(2*60*1000);
        chrome.alarms.onAlarm.addListener(function (alarm) {
            if (alarm.name !== CURRENCY_GAIN) {
                return false;
            }

            setTimeout(() => {
                chrome.alarms.get(alarm.name, (newAlarm) => {
                    let timeDiff = newAlarm.scheduledTime - alarm.scheduledTime;
                    const hours = 60*60*1000;

                    catchError(done, function () {
                        expect(timeDiff).to.be.within(3.9*hours, 4.1*hours);
                    });
                    done();
                });
            }, 100);

            return true;
        });

        update.version(() => {
            chrome.alarms.create(CURRENCY_GAIN, {when: Date.now() + 500});
        });
    });

    it('breaks should increase by multiples of min-cost');

    it('should detect cheating');

    it('should sync only once per minute');

});

mocha.checkLeaks();
mocha.globals(['AppView', 'ExtensionOptions', 'ExtensionView', 'WebView']);
mocha.run();

