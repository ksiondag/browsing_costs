"use strict";

const TimerBox = React.createClass({
    render () {
        return (
            <div>
                {this.props.alarm.name}: {new Date(this.props.alarm.scheduledTime).toLocaleTimeString()}
            </div>
        );
    }
});

const TimerList = React.createClass({
    getInitialState () {
        return {
            alarms: []
        };
    },
    componentDidMount () {
        if (!this.props.getAlarms) {
            return;
        }
        this.props.getAlarms(this);
    },
    render () {
        let alarms;
        alarms = this.state.alarms.map(function (alarm) {
            return (
                <TimerBox key={alarm.name} alarm={alarm} />
            );
        });

        return (
            <div className='browsing-costs-box-timer-list'>
                {alarms}
            </div>
        );
    }
});

