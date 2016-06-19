"use strict";

const ContentTimer = React.createClass({
    getAlarms (component) {
        chrome.runtime.sendMessage({getAlarms: true}, (response) => {
            if (!response) {
                return;
            }
            component.setState(response);
        });
    },
    render () {
        return (
            <TimerList getAlarms={this.getAlarms} />
        );
    }
});

