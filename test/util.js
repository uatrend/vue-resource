import {createApp, h} from 'vue';
import VueResource from '../src/index';

var createTestApp = function (config) {
    Object.assign(config, {render: () => h('div', {})});

    var el = document.createElement('div');
    var app = createApp(config);

    app.config.devtools = true;

    app.use(VueResource);

    return app.mount(el);
};

export {createTestApp};