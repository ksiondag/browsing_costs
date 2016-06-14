"use strict";

const html = document.documentElement;
html.style.visibility = 'hidden';

const div = document.createElement('div');
div.style.position = 'fixed';
div.style.top = '0';
div.style.left = '0';
div.style.width = '100%';   
div.style.height = '100%';
div.style.backgroundColor = 'white';

const revealPaymentBox = function () {
    Array.from(document.body.children).forEach(function (child) {
        child.style.visibility = 'hidden';
    });
    document.body.appendChild(div);
    html.style.visibility = '';
};

const hidePaymentBox = function () {
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
    if (!request.freeUrl) {
        return false;
    }

    hidePaymentBox();
    return true;
});

chrome.runtime.onMessage.addListener(function (request) {
    if (!request.paymentBlock) {
        return false;
    }

    revealPaymentBox();
    return true;
});

const PaymentButton = React.createClass({
    pay () {
        chrome.runtime.sendMessage({spending: true}, function (response) {
            if (response.success) {
                hidePaymentBox();
            }
        });
    },
    render () {
        return (
            <button onClick={this.pay}>
                Pay to use site for 5 minutes
            </button>
        );
    }
});

const PaymentBox = React.createClass({
    render () {
        return (
            <div>
                <div>
                    This is a premium site.
                </div>
                <div>
                    <PaymentButton />
                </div>
            </div>
        );
    }
});

ReactDOM.render(
    <PaymentBox />,
    div
);
