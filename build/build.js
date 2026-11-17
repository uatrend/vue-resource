/* eslint-env node */

const fs = require('fs');
const {resolve} = require('path');
const {promisify} = require('util');
const zlib = require('zlib');
const rollup = require('rollup');
const uglify = require('uglify-js');
const {babel} = require('@rollup/plugin-babel');
const replace = require('@rollup/plugin-replace');
const {name, version, homepage} = require('../package.json');
const banner = `/*!\n * ${name} v${version}\n * ${homepage}\n * Released under the MIT License.\n */\n`;

const gzip = promisify(zlib.gzip);
const readFile = promisify(fs.readFile);
const read = async function (file, cb) {

    const data = await readFile(file, 'utf8');
    cb && cb(data);
    return data;

};

const logFile = async function (file, zip) {
    const data = await read(file);
    if (zip) {
        console.log(`${blue(file)} ${getSize(data)} (${getSize(zip)} gzipped)`);
    } else {
        console.log(`${blue(file)} ${getSize(data)}`);
    }
};

const writeFile = promisify(fs.writeFile);
const write = async function (dest, data, zip) {
    let err;

    err = await writeFile(dest, data);

    if (zip) {
        try {
            zip = await gzip(data);
        } catch (e) {
            err = e;
        }
    }

    if (err) {
        console.log(err);
        throw err;
    }

    logFile(dest, zip);

    return dest;

};

run().catch(({message}) => {
	console.error(message);
	process.exitCode = 1;
});

async function run() {
    const files = [{
        name: 'vue-resource',
        configs: [
            { format: 'umd', banner, name: 'VueResource', sourcemap: false, globals: { vue: 'Vue' } },
            { format: 'es', banner, footer: 'export { Url, Http, Resource };' },
            { format: 'cjs', banner, exports: 'default' }
        ],
        minify: true
    }];

	return Promise.all(files.map(async (file) => {
		let { name, configs, minify } = file;
		return compile('src/index.js', `dist/${name}`, { configs, minify: !!minify })
	}));
};

async function compile (file, dest, {name, configs, minify = true}) {
	name = (name || '').replace(/[^\w]/g, '_');

    const bundle = await rollup.rollup({
        input: resolve(file),
        plugins: [
            babel({ exclude: 'node_modules/**', babelHelpers: 'bundled' }),
            replace({preventAssignment: true, __VERSION__: version})
        ],
        external: ['vue'],
        onwarn(warning, rollupWarn) {
            if (warning.code !== 'CIRCULAR_DEPENDENCY') {
                rollupWarn(warning);
            }
        }
    });

    return configs.map(async (config) => {
        let {output: [{code, map}]} = await bundle.generate(config);
        code = code.replace(/(>)\\n\s+|\\n\s+(<)/g, '$1 $2');

        return [
            config.format === 'umd' ? [write(`${dest}.js`, code), minify ? write(`${dest}.min.js`, uglify.minify(code, {output: {preamble: banner}}).code, true) : null] : null,
            config.format === 'es' ? write(`${dest}.esm.js`, code) : null,
            config.format === 'cjs' ? write(`${dest}.common.js`, code) : null
        ];
    });
}

function blue(str) {
    return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m';
}

function getSize(data) {
    return `${(data.length / 1024).toFixed(2)}kb`;
}
