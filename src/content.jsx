"use strict";

const html = document.documentElement;
html.style.visibility = 'hidden';

const div = document.createElement('div');
div.className = 'browsing-costs-box';

const revealPaymentBox = function () {
    if (div.parentNode) {
        // Already revealed
        return;
    }
    Array.from(document.body.children).forEach(function (child) {
        child.style.visibility = 'hidden';
    });
    document.body.appendChild(div);
    html.style.visibility = '';
    div.style.visibility = '';
};

const hidePaymentBox = function () {
    if (!div.parentNode) {
        // Already hidden
        return;
    }
    document.body.removeChild(div);
    Array.from(document.body.children).forEach(function (child) {
        child.style.visibility = '';
    });
};

chrome.runtime.sendMessage({checkTabUrl: true}, function (response) {
    if (!response || !response.isPremiumSite || response.onBreak) {
        html.style.visibility = '';
        return;
    }

    document.addEventListener('DOMContentLoaded', revealPaymentBox);

    if (document.readyState === 'complete') {
        revealPaymentBox();
    }
});

chrome.runtime.onMessage.addListener(function (request) {
    if (!request.unlock) {
        return false;
    }

    hidePaymentBox();
    return true;
});

chrome.runtime.onMessage.addListener(function (request) {
    if (!request.lock) {
        return false;
    }

    revealPaymentBox();
    return true;
});

const PaymentButton = React.createClass({
    pay () {
        chrome.runtime.sendMessage({cost: this.props.cost});
    },
    render () {
        return (
            <button className='paymentbox-button' onClick={this.pay}>
                Pay {this.props.cost} to use site for 5 minutes
            </button>
        );
    }
});

const PaymentBox = React.createClass({
    getInitialState () {
        return {
            url: area.host(window.location.href),
            cost: 1
        };
    },
    componentDidMount () {
        chrome.runtime.sendMessage({siteState: true}, (response) => {
            if (!response) {
                return;
            }
            this.setState(response);
        });
    },
    render () {
        return (
            <div className='paymentbox'>
                <div className='paymentbox-description'>
                    {this.state.url} is a premium site.
                </div>
                <div>
                    <PaymentButton cost={this.state.cost} />
                </div>
            </div>
        );
    }
});

ReactDOM.render(
    <div>
        <PaymentBox />
        <ContentTimer />
    </div>,
    div
);

