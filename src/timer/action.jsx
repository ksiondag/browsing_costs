"use strict";

const ActionTimer = React.createClass({
    getAlarms (component) {
        chrome.alarms.getAll((alarms) => {
            component.setState({alarms: alarms});
        });
    },
    render () {
        return (
            <TimerList getAlarms={this.getAlarms} />
        );
    }
});
