/*!
 * vue-resource v1.6.1
 * https://github.com/pagekit/vue-resource
 * Released under the MIT License.
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('vue')) :
    typeof define === 'function' && define.amd ? define(['vue'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.VueResource = factory(global.Vue));
})(this, (function (vue) { 'use strict';

    /**
     * Utility functions.
     */

    var {
        hasOwnProperty
      } = {},
      {
        slice
      } = [],
      debug = false;
    const inBrowser = typeof window !== 'undefined';
    function Util (app) {
      const {
        config,
        nextTick,
        version
      } = app;
      debug = config ? (version && version.split('.')[0]) < 3 ? config.devtools || !config.silent : config.performance : debug;
    }
    function warn(msg) {
      if (typeof console !== 'undefined' && debug) {
        console.warn('[VueResource warn]: ' + msg);
      }
    }
    function error(msg) {
      if (typeof console !== 'undefined') {
        console.error(msg);
      }
    }
    function trim(str) {
      return str ? str.replace(/^\s*|\s*$/g, '') : '';
    }
    function trimEnd(str, chars) {
      if (str && chars === undefined) {
        return str.replace(/\s+$/, '');
      }
      if (!str || !chars) {
        return str;
      }
      return str.replace(new RegExp(`[${chars}]+$`), '');
    }
    function toLower(str) {
      return str ? str.toLowerCase() : '';
    }
    function toUpper(str) {
      return str ? str.toUpperCase() : '';
    }
    const isArray = Array.isArray;
    function isString(val) {
      return typeof val === 'string';
    }
    function isFunction(val) {
      return typeof val === 'function';
    }
    function isObject(obj) {
      return obj !== null && typeof obj === 'object';
    }
    function isPlainObject(obj) {
      return isObject(obj) && Object.getPrototypeOf(obj) == Object.prototype;
    }
    function isBlob(obj) {
      return typeof Blob !== 'undefined' && obj instanceof Blob;
    }
    function isFormData(obj) {
      return typeof FormData !== 'undefined' && obj instanceof FormData;
    }
    function when(value, fulfilled, rejected) {
      var promise = Promise.resolve(value);
      if (arguments.length < 2) {
        return promise;
      }
      return promise.then(fulfilled, rejected);
    }
    function options(fn, obj, opts) {
      opts = opts || {};
      if (isFunction(opts)) {
        opts = opts.call(obj);
      }
      return merge(fn.bind({
        $vm: obj,
        $options: opts
      }), fn, {
        $options: opts
      });
    }
    function each(obj, iterator) {
      var i, key;
      if (isArray(obj)) {
        for (i = 0; i < obj.length; i++) {
          iterator.call(obj[i], obj[i], i);
        }
      } else if (isObject(obj)) {
        for (key in obj) {
          if (hasOwnProperty.call(obj, key)) {
            iterator.call(obj[key], obj[key], key);
          }
        }
      }
      return obj;
    }
    const assign = Object.assign || _assign;
    function merge(target) {
      var args = slice.call(arguments, 1);
      args.forEach(source => {
        _merge(target, source, true);
      });
      return target;
    }
    function defaults(target) {
      var args = slice.call(arguments, 1);
      args.forEach(source => {
        for (var key in source) {
          if (target[key] === undefined) {
            target[key] = source[key];
          }
        }
      });
      return target;
    }
    function _assign(target) {
      var args = slice.call(arguments, 1);
      args.forEach(source => {
        _merge(target, source);
      });
      return target;
    }
    function _merge(target, source, deep) {
      for (var key in source) {
        if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
          if (isPlainObject(source[key]) && !isPlainObject(target[key])) {
            target[key] = {};
          }
          if (isArray(source[key]) && !isArray(target[key])) {
            target[key] = [];
          }
          _merge(target[key], source[key], deep);
        } else if (source[key] !== undefined) {
          target[key] = source[key];
        }
      }
    }

    /**
     * Root Prefix Transform.
     */

    function root (options, next) {
      var url = next(options);
      if (isString(options.root) && !/^(https?:)?\//.test(url)) {
        url = trimEnd(options.root, '/') + '/' + url;
      }
      return url;
    }

    /**
     * Query Parameter Transform.
     */

    function query (options, next) {
      var urlParams = Object.keys(Url.options.params),
        query = {},
        url = next(options);
      each(options.params, (value, key) => {
        if (urlParams.indexOf(key) === -1) {
          query[key] = value;
        }
      });
      query = Url.params(query);
      if (query) {
        url += (url.indexOf('?') == -1 ? '?' : '&') + query;
      }
      return url;
    }

    /**
     * URL Template v2.0.6 (https://github.com/bramstein/url-template)
     */

    function expand(url, params, variables) {
      var tmpl = parse(url),
        expanded = tmpl.expand(params);
      if (variables) {
        variables.push.apply(variables, tmpl.vars);
      }
      return expanded;
    }
    function parse(template) {
      var operators = ['+', '#', '.', '/', ';', '?', '&'],
        variables = [];
      return {
        vars: variables,
        expand(context) {
          return template.replace(/\{([^{}]+)\}|([^{}]+)/g, (_, expression, literal) => {
            if (expression) {
              var operator = null,
                values = [];
              if (operators.indexOf(expression.charAt(0)) !== -1) {
                operator = expression.charAt(0);
                expression = expression.substr(1);
              }
              expression.split(/,/g).forEach(variable => {
                var tmp = /([^:*]*)(?::(\d+)|(\*))?/.exec(variable);
                values.push.apply(values, getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
                variables.push(tmp[1]);
              });
              if (operator && operator !== '+') {
                var separator = ',';
                if (operator === '?') {
                  separator = '&';
                } else if (operator !== '#') {
                  separator = operator;
                }
                return (values.length !== 0 ? operator : '') + values.join(separator);
              } else {
                return values.join(',');
              }
            } else {
              return encodeReserved(literal);
            }
          });
        }
      };
    }
    function getValues(context, operator, key, modifier) {
      var value = context[key],
        result = [];
      if (isDefined(value) && value !== '') {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          value = value.toString();
          if (modifier && modifier !== '*') {
            value = value.substring(0, parseInt(modifier, 10));
          }
          result.push(encodeValue(operator, value, isKeyOperator(operator) ? key : null));
        } else {
          if (modifier === '*') {
            if (Array.isArray(value)) {
              value.filter(isDefined).forEach(value => {
                result.push(encodeValue(operator, value, isKeyOperator(operator) ? key : null));
              });
            } else {
              Object.keys(value).forEach(k => {
                if (isDefined(value[k])) {
                  result.push(encodeValue(operator, value[k], k));
                }
              });
            }
          } else {
            var tmp = [];
            if (Array.isArray(value)) {
              value.filter(isDefined).forEach(value => {
                tmp.push(encodeValue(operator, value));
              });
            } else {
              Object.keys(value).forEach(k => {
                if (isDefined(value[k])) {
                  tmp.push(encodeURIComponent(k));
                  tmp.push(encodeValue(operator, value[k].toString()));
                }
              });
            }
            if (isKeyOperator(operator)) {
              result.push(encodeURIComponent(key) + '=' + tmp.join(','));
            } else if (tmp.length !== 0) {
              result.push(tmp.join(','));
            }
          }
        }
      } else {
        if (operator === ';') {
          result.push(encodeURIComponent(key));
        } else if (value === '' && (operator === '&' || operator === '?')) {
          result.push(encodeURIComponent(key) + '=');
        } else if (value === '') {
          result.push('');
        }
      }
      return result;
    }
    function isDefined(value) {
      return value !== undefined && value !== null;
    }
    function isKeyOperator(operator) {
      return operator === ';' || operator === '&' || operator === '?';
    }
    function encodeValue(operator, value, key) {
      value = operator === '+' || operator === '#' ? encodeReserved(value) : encodeURIComponent(value);
      if (key) {
        return encodeURIComponent(key) + '=' + value;
      } else {
        return value;
      }
    }
    function encodeReserved(str) {
      return str.split(/(%[0-9A-Fa-f]{2})/g).map(part => {
        if (!/%[0-9A-Fa-f]/.test(part)) {
          part = encodeURI(part);
        }
        return part;
      }).join('');
    }

    /**
     * URL Template (RFC 6570) Transform.
     */

    function template (options) {
      var variables = [],
        url = expand(options.url, options.params, variables);
      variables.forEach(key => {
        delete options.params[key];
      });
      return url;
    }

    /**
     * Service for URL templating.
     */

    function Url(url, params) {
      var self = this || {},
        options = url,
        transform;
      if (isString(url)) {
        options = {
          url,
          params
        };
      }
      options = merge({}, Url.options, self.$options, options);
      Url.transforms.forEach(handler => {
        if (isString(handler)) {
          handler = Url.transform[handler];
        }
        if (isFunction(handler)) {
          transform = factory(handler, transform, self.$vm);
        }
      });
      return transform(options);
    }

    /**
     * Url options.
     */

    Url.options = {
      url: '',
      root: null,
      params: {}
    };

    /**
     * Url transforms.
     */

    Url.transform = {
      template,
      query,
      root
    };
    Url.transforms = ['template', 'query', 'root'];

    /**
     * Encodes a Url parameter string.
     *
     * @param {Object} obj
     */

    Url.params = function (obj) {
      var params = [],
        escape = encodeURIComponent;
      params.add = function (key, value) {
        if (isFunction(value)) {
          value = value();
        }
        if (value === null) {
          value = '';
        }
        this.push(escape(key) + '=' + escape(value));
      };
      serialize(params, obj);
      return params.join('&').replace(/%20/g, '+');
    };

    /**
     * Parse a URL and return its components.
     *
     * @param {String} url
     */

    Url.parse = function (url) {
      var el = document.createElement('a');
      if (document.documentMode) {
        el.href = url;
        url = el.href;
      }
      el.href = url;
      return {
        href: el.href,
        protocol: el.protocol ? el.protocol.replace(/:$/, '') : '',
        port: el.port,
        host: el.host,
        hostname: el.hostname,
        pathname: el.pathname.charAt(0) === '/' ? el.pathname : '/' + el.pathname,
        search: el.search ? el.search.replace(/^\?/, '') : '',
        hash: el.hash ? el.hash.replace(/^#/, '') : ''
      };
    };
    function factory(handler, next, vm) {
      return options => {
        return handler.call(vm, options, next);
      };
    }
    function serialize(params, obj, scope) {
      var array = isArray(obj),
        plain = isPlainObject(obj),
        hash;
      each(obj, (value, key) => {
        hash = isObject(value) || isArray(value);
        if (scope) {
          key = scope + '[' + (plain || hash ? key : '') + ']';
        }
        if (!scope && array) {
          params.add(value.name, value.value);
        } else if (hash) {
          serialize(params, value, key);
        } else {
          params.add(key, value);
        }
      });
    }

    /**
     * XDomain client (Internet Explorer).
     */

    // import Promise from '../../promise';

    function xdrClient (request) {
      return new Promise(resolve => {
        var xdr = new XDomainRequest(),
          handler = _ref => {
            let {
              type
            } = _ref;
            var status = 0;
            if (type === 'load') {
              status = 200;
            } else if (type === 'error') {
              status = 500;
            }
            resolve(request.respondWith(xdr.responseText, {
              status
            }));
          };
        request.abort = () => xdr.abort();
        xdr.open(request.method, request.getUrl());
        if (request.timeout) {
          xdr.timeout = request.timeout;
        }
        xdr.onload = handler;
        xdr.onabort = handler;
        xdr.onerror = handler;
        xdr.ontimeout = handler;
        xdr.onprogress = () => {};
        xdr.send(request.getBody());
      });
    }

    /**
     * CORS Interceptor.
     */

    const SUPPORTS_CORS = inBrowser && 'withCredentials' in new XMLHttpRequest();
    function cors (request) {
      if (inBrowser) {
        const orgUrl = Url.parse(location.href);
        const reqUrl = Url.parse(request.getUrl());
        if (reqUrl.protocol !== orgUrl.protocol || reqUrl.host !== orgUrl.host) {
          request.crossOrigin = true;
          request.emulateHTTP = false;
          if (!SUPPORTS_CORS) {
            request.client = xdrClient;
          }
        }
      }
    }

    /**
     * Form data Interceptor.
     */

    function form (request) {
      if (isFormData(request.body)) {
        request.headers.delete('Content-Type');
      } else if (isObject(request.body) && request.emulateJSON) {
        request.body = Url.params(request.body);
        request.headers.set('Content-Type', 'application/x-www-form-urlencoded');
      }
    }

    /**
     * JSON Interceptor.
     */

    function json (request) {
      const type = request.headers.get('Content-Type') || '';
      if (isObject(request.body) && type.indexOf('application/json') === 0) {
        request.body = JSON.stringify(request.body);
      }
      return response => {
        return response.bodyText ? when(response.text(), text => {
          const type = response.headers.get('Content-Type') || '';
          if (type.indexOf('application/json') === 0 || isJson(text)) {
            try {
              response.body = JSON.parse(text);
            } catch (e) {
              response.body = null;
            }
          } else {
            response.body = text;
          }
          return response;
        }) : response;
      };
    }
    function isJson(str) {
      const start = str.match(/^\s*(\[|\{)/);
      const end = {
        '[': /]\s*$/,
        '{': /}\s*$/
      };
      return start && end[start[1]].test(str);
    }

    /**
     * JSONP client (Browser).
     */

    // import Promise from '../../promise';

    function jsonpClient (request) {
      return new Promise(resolve => {
        var name = request.jsonp || 'callback',
          callback = request.jsonpCallback || '_jsonp' + Math.random().toString(36).substr(2),
          body = null,
          handler,
          script;
        handler = _ref => {
          let {
            type
          } = _ref;
          var status = 0;
          if (type === 'load' && body !== null) {
            status = 200;
          } else if (type === 'error') {
            status = 500;
          }
          if (status && window[callback]) {
            delete window[callback];
            document.body.removeChild(script);
          }
          resolve(request.respondWith(body, {
            status
          }));
        };
        window[callback] = result => {
          body = JSON.stringify(result);
        };
        request.abort = () => {
          handler({
            type: 'abort'
          });
        };
        request.params[name] = callback;
        if (request.timeout) {
          setTimeout(request.abort, request.timeout);
        }
        script = document.createElement('script');
        script.src = request.getUrl();
        script.type = 'text/javascript';
        script.async = true;
        script.onload = handler;
        script.onerror = handler;
        document.body.appendChild(script);
      });
    }

    /**
     * JSONP Interceptor.
     */

    function jsonp (request) {
      if (request.method == 'JSONP') {
        request.client = jsonpClient;
      }
    }

    /**
     * Before Interceptor.
     */

    function before (request) {
      if (isFunction(request.before)) {
        request.before.call(this, request);
      }
    }

    /**
     * HTTP method override Interceptor.
     */

    function method (request) {
      if (request.emulateHTTP && /^(PUT|PATCH|DELETE)$/i.test(request.method)) {
        request.headers.set('X-HTTP-Method-Override', request.method);
        request.method = 'POST';
      }
    }

    /**
     * Header Interceptor.
     */

    function header (request) {
      const headers = assign({}, Http.headers.common, !request.crossOrigin ? Http.headers.custom : {}, Http.headers[toLower(request.method)]);
      each(headers, (value, name) => {
        if (!request.headers.has(name)) {
          request.headers.set(name, value);
        }
      });
    }

    /**
     * XMLHttp client (Browser).
     */

    function xhrClient (request) {
      return new Promise(resolve => {
        var xhr = new XMLHttpRequest(),
          handler = event => {
            var response = request.respondWith('response' in xhr ? xhr.response : xhr.responseText, {
              status: xhr.status === 1223 ? 204 : xhr.status,
              // IE9 status bug
              statusText: xhr.status === 1223 ? 'No Content' : trim(xhr.statusText)
            });
            each(trim(xhr.getAllResponseHeaders()).split('\n'), row => {
              response.headers.append(row.slice(0, row.indexOf(':')), row.slice(row.indexOf(':') + 1));
            });
            resolve(response);
          };
        request.abort = () => xhr.abort();
        xhr.open(request.method, request.getUrl(), true);
        if (request.timeout) {
          xhr.timeout = request.timeout;
        }
        if (request.responseType && 'responseType' in xhr) {
          xhr.responseType = request.responseType;
        }
        if (request.withCredentials || request.credentials) {
          xhr.withCredentials = true;
        }
        if (!request.crossOrigin) {
          request.headers.set('X-Requested-With', 'XMLHttpRequest');
        }

        // deprecated use downloadProgress
        if (isFunction(request.progress) && request.method === 'GET') {
          xhr.addEventListener('progress', request.progress);
        }
        if (isFunction(request.downloadProgress)) {
          xhr.addEventListener('progress', request.downloadProgress);
        }

        // deprecated use uploadProgress
        if (isFunction(request.progress) && /^(POST|PUT)$/i.test(request.method)) {
          xhr.upload.addEventListener('progress', request.progress);
        }
        if (isFunction(request.uploadProgress) && xhr.upload) {
          xhr.upload.addEventListener('progress', request.uploadProgress);
        }
        request.headers.forEach((value, name) => {
          xhr.setRequestHeader(name, value);
        });
        xhr.onload = handler;
        xhr.onabort = handler;
        xhr.onerror = handler;
        xhr.ontimeout = handler;
        xhr.send(request.getBody());
      });
    }

    /**
     * Http client (Node).
     */

    function nodeClient (request) {
      const client = require('got');
      return new Promise(resolve => {
        var url = request.getUrl();
        var body = request.getBody();
        var method = request.method;
        var headers = {},
          handler;
        request.headers.forEach((value, name) => {
          headers[name] = value;
        });
        client(url, {
          body,
          method,
          headers
        }).then(handler = resp => {
          var response = request.respondWith(resp.body, {
            status: resp.statusCode,
            statusText: trim(resp.statusMessage)
          });
          each(resp.headers, (value, name) => {
            response.headers.set(name, value);
          });
          resolve(response);
        }, error => handler(error.response));
      });
    }

    /**
     * Base client.
     */

    function Client (context) {
      const reqHandlers = [sendRequest],
        resHandlers = [];
      if (!isObject(context)) {
        context = null;
      }
      function Client(request) {
        while (reqHandlers.length) {
          const handler = reqHandlers.pop();
          if (isFunction(handler)) {
            let response, next;
            response = handler.call(context, request, val => next = val) || next;
            if (isObject(response)) {
              return new Promise((resolve, reject) => {
                resHandlers.forEach(handler => {
                  response = when(response, response => {
                    return handler.call(context, response) || response;
                  }, reject);
                });
                when(response, resolve, reject);
              }, context);
            }
            if (isFunction(response)) {
              resHandlers.unshift(response);
            }
          } else {
            warn(`Invalid interceptor of type ${typeof handler}, must be a function`);
          }
        }
      }
      Client.use = handler => {
        reqHandlers.push(handler);
      };
      return Client;
    }
    function sendRequest(request) {
      const client = request.client || (inBrowser ? xhrClient : nodeClient);
      return client(request);
    }

    /**
     * HTTP Headers.
     */

    class Headers {
      constructor(headers) {
        this.map = {};
        each(headers, (value, name) => this.append(name, value));
      }
      has(name) {
        return getName(this.map, name) !== null;
      }
      get(name) {
        var list = this.map[getName(this.map, name)];
        return list ? list.join() : null;
      }
      getAll(name) {
        return this.map[getName(this.map, name)] || [];
      }
      set(name, value) {
        this.map[normalizeName(getName(this.map, name) || name)] = [trim(value)];
      }
      append(name, value) {
        var list = this.map[getName(this.map, name)];
        if (list) {
          list.push(trim(value));
        } else {
          this.set(name, value);
        }
      }
      delete(name) {
        delete this.map[getName(this.map, name)];
      }
      deleteAll() {
        this.map = {};
      }
      forEach(callback, thisArg) {
        each(this.map, (list, name) => {
          each(list, value => callback.call(thisArg, value, name, this));
        });
      }
    }
    function getName(map, name) {
      return Object.keys(map).reduce((prev, curr) => {
        return toLower(name) === toLower(curr) ? curr : prev;
      }, null);
    }
    function normalizeName(name) {
      if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
        throw new TypeError('Invalid character in header field name');
      }
      return trim(name);
    }

    /**
     * HTTP Response.
     */

    class Response {
      constructor(body, _ref) {
        let {
          url,
          headers,
          status,
          statusText
        } = _ref;
        this.url = url;
        this.ok = status >= 200 && status < 300;
        this.status = status || 0;
        this.statusText = statusText || '';
        this.headers = new Headers(headers);
        this.body = body;
        if (isString(body)) {
          this.bodyText = body;
        } else if (isBlob(body)) {
          this.bodyBlob = body;
          if (isBlobText(body)) {
            this.bodyText = blobText(body);
          }
        }
      }
      blob() {
        return when(this.bodyBlob);
      }
      text() {
        return when(this.bodyText);
      }
      json() {
        return when(this.text(), text => JSON.parse(text));
      }
    }
    Object.defineProperty(Response.prototype, 'data', {
      get() {
        return this.body;
      },
      set(body) {
        this.body = body;
      }
    });
    function blobText(body) {
      return new Promise(resolve => {
        var reader = new FileReader();
        reader.readAsText(body);
        reader.onload = () => {
          resolve(reader.result);
        };
      });
    }
    function isBlobText(body) {
      return body.type.indexOf('text') === 0 || body.type.indexOf('json') !== -1;
    }

    /**
     * HTTP Request.
     */

    class Request {
      constructor(options) {
        this.body = null;
        this.params = {};
        assign(this, options, {
          method: toUpper(options.method || 'GET')
        });
        if (!(this.headers instanceof Headers)) {
          this.headers = new Headers(this.headers);
        }
      }
      getUrl() {
        return Url(this);
      }
      getBody() {
        return this.body;
      }
      respondWith(body, options) {
        return new Response(body, assign(options || {}, {
          url: this.getUrl()
        }));
      }
    }

    /**
     * Service for sending network requests.
     */

    const COMMON_HEADERS = {
      'Accept': 'application/json, text/plain, */*'
    };
    const JSON_CONTENT_TYPE = {
      'Content-Type': 'application/json;charset=utf-8'
    };
    function Http(options) {
      var self = this || {},
        client = Client(self.$vm);
      defaults(options || {}, self.$options, Http.options);
      Http.interceptors.forEach(handler => {
        if (isString(handler)) {
          handler = Http.interceptor[handler];
        }
        if (isFunction(handler)) {
          client.use(handler);
        }
      });
      return client(new Request(options)).then(response => {
        return response.ok ? response : Promise.reject(response);
      }, response => {
        if (response instanceof Error) {
          error(response);
        }
        return Promise.reject(response);
      });
    }
    Http.options = {};
    Http.headers = {
      put: JSON_CONTENT_TYPE,
      post: JSON_CONTENT_TYPE,
      patch: JSON_CONTENT_TYPE,
      delete: JSON_CONTENT_TYPE,
      common: COMMON_HEADERS,
      custom: {}
    };
    Http.interceptor = {
      before,
      method,
      jsonp,
      json,
      form,
      header,
      cors
    };
    Http.interceptors = ['before', 'method', 'jsonp', 'json', 'form', 'header', 'cors'];
    ['get', 'delete', 'head', 'jsonp'].forEach(method => {
      Http[method] = function (url, options) {
        return this(assign(options || {}, {
          url,
          method
        }));
      };
    });
    ['post', 'put', 'patch'].forEach(method => {
      Http[method] = function (url, body, options) {
        return this(assign(options || {}, {
          url,
          method,
          body
        }));
      };
    });

    /**
     * Service for interacting with RESTful services.
     */

    function Resource(url, params, actions, options) {
      var self = this || {},
        resource = {};
      actions = assign({}, Resource.actions, actions);
      each(actions, (action, name) => {
        action = merge({
          url,
          params: assign({}, params)
        }, options, action);
        resource[name] = function () {
          return (self.$http || Http)(opts(action, arguments));
        };
      });
      return resource;
    }
    function opts(action, args) {
      var options = assign({}, action),
        params = {},
        body;
      switch (args.length) {
        case 2:
          params = args[0];
          body = args[1];
          break;
        case 1:
          if (/^(POST|PUT|PATCH)$/i.test(options.method)) {
            body = args[0];
          } else {
            params = args[0];
          }
          break;
        case 0:
          break;
        default:
          throw 'Expected up to 2 arguments [params, body], got ' + args.length + ' arguments';
      }
      options.body = body;
      options.params = assign({}, options.params, params);
      return options;
    }
    Resource.actions = {
      get: {
        method: 'GET'
      },
      save: {
        method: 'POST'
      },
      query: {
        method: 'GET'
      },
      update: {
        method: 'PUT'
      },
      remove: {
        method: 'DELETE'
      },
      delete: {
        method: 'DELETE'
      }
    };

    /**
     * Install plugin.
     */

    function plugin(app) {
      const {
        globalInstance
      } = app.config;
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
    function defineProperties(obj, app, enumerable) {
      if (enumerable === void 0) {
        enumerable = false;
      }
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
        const {
          proxy
        } = vue.getCurrentInstance() || {};
        return [proxy || {}, proxy?.$options || {}];
      } else {
        return [this, this.$options];
      }
    }
    function enumerate(obj, enumerable) {
      return enumerable ? Object.entries(obj).reduce((props, _ref) => {
        let [key, prop] = _ref;
        props[key] = Object.assign(prop, {
          enumerable
        });
        return props;
      }, {}) : obj;
    }
    function getVueVersion(app) {
      return app && app.version && Number(app.version.split('.')[0]);
    }
    if (typeof exports === 'object') {
      module.exports = plugin;
    } else if (typeof define === 'function' && define.amd) {
      define([], function () {
        return plugin;
      });
    } else if (typeof window !== 'undefined' && window.Vue && window.Vue.use) {
      Vue.use(plugin);
    }

    return plugin;

}));
