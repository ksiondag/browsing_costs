'use strict';

const AddBox = React.createClass({
    submitUrl () {
        shared.newSite(this.props.url);
    },
    render () {
        return (
            <button className='siteBox-button' onClick={this.submitUrl}>
                Make {this.props.url} a Premium Site
            </button>
        );
    }
});

const RemoveBox = React.createClass({
    removeUrl () {
        shared.removeSite(this.props.url);
    },
    render () {
        return (
            <button className='siteBox-button' onClick={this.removeUrl}>
                Remove {this.props.url} from Premium Sites
            </button>
        );
    }
});

// TODO: add current site to premium sites button
// E.g. www.reddit.com
const SiteBox = React.createClass({
    getInitialState () {
        return {isPremiumSite: true};
    },
    setStateFromShared () {
        shared.getCurrentTabHost((host) => {
            // TODO 2016/06/13 Silent Kat
            // This setup is hacky, I remove the protocol, need to add one
            shared.isPremiumSite('fake://' + host, (isPremiumSite) => {
                this.setState({isPremiumSite: isPremiumSite});
            });
        });
    },
    componentDidMount () {
        // Popup mounted. Fetching state from shared fetching
        this.setStateFromShared();

        shared.onChanged(() => {
            // Local storage changes, updating popup render
            this.setStateFromShared();
        });
    },
    render () {
        let TempBox = AddBox;

        if (this.state.isPremiumSite) {
            TempBox = RemoveBox;
        }

        return (
            <div className='siteBox'>
                <TempBox url={this.props.url} />
            </div>
        );
    }
});

// TODO: add current site subarea to premium sites button
// E.g. www.reddit.com/r/gaming only charges for /r/gaming and not all reddit

// TODO: pay for a site subarea to not be premium
// E.g. www.reddit.com is a premium site but www.reddit.com/r/gamedev is okay

// TODO: options link

document.addEventListener('DOMContentLoaded', function () {
    shared.getCurrentTabHost(function (url) {
        ReactDOM.render(
            <SiteBox url={url} />,
            document.getElementById('container')
        );
    });
});

