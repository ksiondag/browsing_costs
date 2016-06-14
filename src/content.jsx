"use strict";

const html = document.getElementsByTagName('html')[0];

html.style.display = 'none';

const div = document.createElement('div');
div.style.position = 'fixed';
div.style.top = '0';
div.style.left = '0';
div.style.width = '100%';   
div.style.height = '100%';
div.style.backgroundColor = 'white';

ReactDOM.render(
    <div>This is a premium site.</div>,
    div
);

chrome.runtime.sendMessage({checkTabUrl: true}, function (response) {
    if (!response || !response.isPremiumSite) {
        html.style.display = 'block';
        return;
    }

    window.onload = function () {
        Array.from(document.body.children).forEach(function (child) {
            child.style.display = 'none';
        });
        document.body.appendChild(div);
        html.style.display = 'block';
    };

});
