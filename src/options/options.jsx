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
        return {value: 'http://www.example.com'};
    },
    handleChange (event) {
        this.setState({value: event.target.value});
    },
    submitUrl () {
        this.props.newSite(this.state.value);
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
                <SiteForm newSite={this.props.newSite} />
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
            money: '',
            newSite: () => null
        }
    },
    componentDidMount () {
        console.log('Fetching state from chrome storage');
        chrome.storage.sync.get(null, (items) => {
            let id;

            this.setState({
                newSite: (siteUrl) => {
                    let exists = this.state.premiumSites.some((site) => {
                        return site.url === siteUrl;
                    });

                    if (exists) {
                        return;
                    }

                    let siteId = id;
                    id += 1;
                    let updatedSites = this.state.premiumSites.slice();
                    updatedSites.push({id: siteId, url: siteUrl});

                    chrome.storage.sync.set({premiumSites: updatedSites});
                    // TODO:
                    // This is a proof of implementation
                    // Remove/update with new money system
                    chrome.storage.sync.set({money: this.state.money + 1});
                }
            });

            if (Object.keys(items).indexOf('premiumSites') === -1) {
                console.log('Initializing premium sites list');
                chrome.storage.sync.set({premiumSites: []});
                items.premiumSites = [];
            }

            if (Object.keys(items).indexOf('money') === -1) {
                console.log('Initializing money to zero');
                chrome.storage.sync.set({money: 0});
                items.money = 0;
            }
            if (items.premiumSites.length === 0) {
                id = 1;
            } else {
                id = items.premiumSites.slice(-1)[0].id + 1;
            }

            Object.keys(items).filter(function (key) {
                return ['premiumSites', 'money'].some(
                    (check) => check === key
                );
            }).forEach((key) => {
                this.setState({[key]: items[key]});
            });
        });

        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName !== 'sync') {
                return;
            }

            Object.keys(changes).forEach((key) => {
                if (changes[key].newValue === undefined) {
                    return;
                }
                this.setState({[key]: changes[key].newValue});
            });
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
                    newSite={this.state.newSite}
                />
            </div>
        );
    }
});

ReactDOM.render(
    <OptionsBox />,
    document.getElementById('container')
);

