'use strict';

const SiteCost = React.createClass({
    decrement () {
        storage.decrement(this.props.site.url);
    },
    increment () {
        storage.increment(this.props.site.url);
    },
    render () {
        return (
            <span>
                <button
                    className='premiumSiteCost-decrement'
                    onClick={this.decrement}
                >
                    -
                </button>
                <span className='premiumSiteCost-value'>
                    {this.props.site.minCost}
                </span>
                <button
                    className='premiumSiteCost-increment'
                    onClick={this.increment}
                >
                    +
                </button>
            </span>
        );
    }
});

// TODO
const SiteRemove = React.createClass({
    render () {
        return (
            <button className='premiumSiteRemove-button'>
                Remove (-{this.props.site.minCost})
            </button>
        );
    }
});

const PremiumSite = React.createClass({
    render () {
        return (
            <div className='premiumSiteRow'>
                <span className='premiumSiteArea'>
                    {this.props.site.url}
                </span>
                <span className='premiumSiteCost'>
                    <SiteCost site={this.props.site} />
                </span>
            </div>
        );
    }
});

const SiteList = React.createClass({
    render () {
        let sites;
        if (this.props.premiumSites) {
            sites = this.props.premiumSites.map(function (site) {
                return (
                    <PremiumSite key={site.id} site={site} />
                );
            });
        }

        return (
            <div className='siteList'>
                {sites}
            </div>
        );
    }
});

const SiteForm = React.createClass({
    getInitialState () {
        return {value: 'www.example.com'};
    },
    handleChange (event) {
        this.setState({value: event.target.value});
    },
    submitUrl () {
        storage.newSite(this.state.value);
        this.setState(this.getInitialState());
    },
    enterCheck (event) {
        if (event.key === 'Enter') {
            this.submitUrl();
        }
    },
    render () {
        return (
            <div className='siteForm'>
                <input
                    type='text'
                    value={this.state.value}
                    onChange={this.handleChange}
                    onKeyPress={this.enterCheck}
                />
                <button onClick={this.submitUrl}>
                    Submit Url
                </button>
            </div>
        );
    }
});

const SiteBox = React.createClass({
    render () {
        return (
            <div className='siteBox'>
                <h1>Premium Sites</h1>
                <SiteList premiumSites={this.props.premiumSites} />
            </div>
        );
    }
});

const MoneyBox = React.createClass({
    render () {
        return (
            <div className='moneyBox'>
                <h1>Monies</h1>
                {this.props.money}
            </div>
        );
    }
});

const OptionsBox = React.createClass({
    getInitialState () {
        return {
            premiumSites: [],
            money: ''
        }
    },
    setStateFromShared () {
        storage.get(null, (items) => {
            Object.keys(items).filter(function (key) {
                return ['premiumSites', 'money'].some(
                    (check) => check === key
                );
            }).forEach((key) => {
                this.setState({[key]: items[key]});
            });
        });
    },
    componentDidMount () {
        // Options mounted. Fetching state from storage fetching
        this.setStateFromShared();

        storage.onChanged(() => {
            // Local storage changes, updating options render
            this.setStateFromShared();
        });
    },
    render () {
        return (
            <div className='optionsBox'>
                <MoneyBox
                    money={this.state.money}
                />
                <SiteBox
                    premiumSites={this.state.premiumSites}
                />
            </div>
        );
    }
});

ReactDOM.render(
    <OptionsBox />,
    document.getElementById('container')
);

