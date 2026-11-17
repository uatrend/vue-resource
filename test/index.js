import {createApp, h} from 'vue';
import VueResource from '../src/index.js';

import url from './url';
import http from './http';
import resource from './resource';
// import promise from './promise';

const app = createApp({render: () => h('div', {})});
app.use(VueResource);

url(app);
http(app);
resource();
// promise();