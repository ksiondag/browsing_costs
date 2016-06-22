'use strict';

const area = (() => {
    return {
        host (url) {
            if (!url.includes('/')) {
                return url;
            }
            const pathArray = url.split('/');
            const host = pathArray[2];
            return host;
        },
        break (url) {
            return `${this.host(url)}EndBreak`;
        }
    };
})();

