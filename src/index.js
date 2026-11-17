/**
 * Install plugin.
 */

import {getCurrentInstance} from 'vue';

import Url from './url/index';
import Http from './http/index';
import Resource from './resource';
import Util, {options, warn} from './util';

function plugin(app) {
    const {globalInstance} = app.config;

    if (app.vueResourceInstalled) {
        return;
    }

    const vueVersion = getVueVersion(app);

    Util(app);

    app.url = Url;
    app.http = Http;
    app.resource = Resource;

    if (vueVersion < 3) {
        defineProperties.call(null, app.prototype, app);
    } else {
        defineProperties.call(app, app.config.globalProperties, globalInstance || app, true);
    }

    app.vueResourceInstalled = true;
}

function defineProperties(obj, app, enumerable = false) {
    const _vue = this;
    const definedProps = {
        $url: {
            get() {
                const [$this, $options] = getInstanceProps.call(this, _vue);
                return options(app.url, $this, $options.url);
            }
        },
        $http: {
            get() {
                const [$this, $options] = getInstanceProps.call(this, _vue);
                return options(app.http, $this, $options.http);
            }
        },
        $resource: {
            get() {
                const [$this] = getInstanceProps.call(this, _vue);
                return app.resource.bind($this);
            }
        }
    };

    Object.defineProperties(obj, enumerate(definedProps, enumerable));
}

function getInstanceProps(_vue) {
    if (_vue) {
        const {proxy} = getCurrentInstance() || {}

        return [proxy || {}, proxy?.$options || {}];
    } else {
        return [this, this.$options];
    }
}

function enumerate(obj, enumerable) {
    return enumerable ? Object.entries(obj).reduce((props, [key, prop]) => {
        props[key] = Object.assign(prop, {enumerable});

        return props;
    }, {}) : obj;
}

function getVueVersion (app) {
    return app && app.version && Number(app.version.split('.')[0])
}

if (typeof exports === 'object') {
    module.exports = plugin;
} else if (typeof define === 'function' && define.amd) {
    define([], function () { return plugin; });
} else if (typeof window !== 'undefined' && window.Vue && window.Vue.use) {
    Vue.use(plugin);
}

export default plugin;
