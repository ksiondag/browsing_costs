'use strict';

const area = (() => {
    return {
        host (url) {
            const pathArray = url.split('/');
            const host = pathArray[2];
            return host;
        },
        break (url) {
            return `${this.host(url)}EndBreak`;
        }
    };
})();

