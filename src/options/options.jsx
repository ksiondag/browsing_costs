'use strict';

const PremiumSite = React.createClass({
    render () {
        return (
            <div className='premiumSite'>
                {this.props.children}
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
                    <PremiumSite key={site.id}>
                        {site.url}
                    </PremiumSite>
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
        shared.newSite(this.state.value);
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
                <SiteForm />
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
        shared.get(null, (items) => {
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
        // Options mounted. Fetching state from shared fetching
        this.setStateFromShared();

        shared.onChanged(() => {
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

