module.exports = config => {

  config.set({

    basePath: __dirname,

    frameworks: ['jasmine'],

    browsers: ['Chrome'],

    files: [
      'index.js', {
        pattern: 'data/*',
        included: false
      },
    ],

    preprocessors: {
      'index.js': ['webpack']
    },

    proxies: {
      '/data/': '/base/data/'
    },

    webpack: {
      mode: 'development'
    }

  });

};
