"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestClient = void 0;
const query_string_1 = require("query-string");
const errors_1 = require("./errors");
const pipe = (fn) => (...args) => fn(...args);
function buildFormData(data, formData = new FormData(), parentKey) {
    if (data instanceof FormData) {
        return data;
    }
    if (!data) {
        return formData;
    }
    if (typeof data === 'object' && !(data instanceof File)) {
        Object.keys(data).forEach((key) => {
            buildFormData(formData, data[key], parentKey ? `${parentKey}[${key}]` : key);
        });
    }
    else {
        data && parentKey && formData.append(parentKey, data);
    }
    return formData;
}
const checkIfIsFormData = (data = {}) => {
    if (data instanceof FormData) {
        return true;
    }
    return Object.values(data).some((value) => {
        if (value && typeof value === 'object' && !(value instanceof File)) {
            return checkIfIsFormData(value);
        }
        return value instanceof File;
    });
};
class RestClient {
    constructor({ baseUrl, credentials, headers = {} }) {
        this.headers = {};
        this.setCredentials = (credentials) => {
            this.credentials = credentials;
        };
        this.upload = (endpoint, params, events, options = {}) => {
            if (!params) {
                throw new Error('Missing params');
            }
            const xhr = new XMLHttpRequest();
            const data = new FormData();
            Object.entries(params).forEach(([key, value]) => {
                if (value instanceof File) {
                    data.append(key, value, value.name);
                    return;
                }
                value && data.append(key, value);
            });
            xhr.open('POST', `${this.baseUrl}${`/${endpoint}`.replace(/\/+/, '/')}`, true);
            Object.entries(Object.assign(Object.assign({}, this.getCredentialsAsHeaders()), options.headers)).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value);
            });
            if (events === null || events === void 0 ? void 0 : events.load) {
                xhr.upload.addEventListener('load', events.load);
            }
            if (events === null || events === void 0 ? void 0 : events.progress) {
                xhr.upload.addEventListener('progress', events.progress);
            }
            if (events === null || events === void 0 ? void 0 : events.error) {
                xhr.addEventListener('error', events.error);
            }
            if (events === null || events === void 0 ? void 0 : events.abort) {
                xhr.addEventListener('abort', events.abort);
            }
            xhr.send(data);
            return xhr;
        };
        this.baseUrl = `${baseUrl}/api`;
        this.setCredentials(credentials);
        this.headers = headers;
    }
    getCredentials() {
        return this.credentials;
    }
    get(endpoint, params, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (/\?/.test(endpoint)) {
                // throw new Error('Endpoint cannot contain query string');
                console.warn('Endpoint cannot contain query string', endpoint);
            }
            const queryParams = this.getParams(params);
            const response = yield this.send(`${endpoint}${queryParams ? `?${queryParams}` : ''}`, 'GET', options !== null && options !== void 0 ? options : {});
            return response.json();
        });
    }
    post(endpoint_1, params_1) {
        return __awaiter(this, arguments, void 0, function* (endpoint, params, _a = {}) {
            var { headers } = _a, options = __rest(_a, ["headers"]);
            const isFormData = checkIfIsFormData(params);
            const response = yield this.send(endpoint, 'POST', Object.assign({ body: isFormData ? buildFormData(params) : JSON.stringify(params), headers: Object.assign(Object.assign({ Accept: 'application/json' }, (!isFormData && { 'Content-Type': 'application/json' })), headers) }, options));
            // If the server sent no data, return an empty record as we're only expecting objects.
            if (response.status === 204) {
                return {};
            }
            return response.json();
        });
    }
    put(endpoint_1, params_1) {
        return __awaiter(this, arguments, void 0, function* (endpoint, params, _a = {}) {
            var { headers } = _a, options = __rest(_a, ["headers"]);
            const isFormData = checkIfIsFormData(params);
            const response = yield this.send(endpoint, 'PUT', Object.assign({ body: isFormData ? buildFormData(params) : JSON.stringify(params), headers: Object.assign(Object.assign({ Accept: 'application/json' }, (!isFormData && { 'Content-Type': 'application/json' })), headers) }, options));
            return response.json();
        });
    }
    delete(endpoint_1, _params_1) {
        return __awaiter(this, arguments, void 0, function* (endpoint, _params, options = {}) {
            const response = yield this.send(endpoint, 'DELETE', options !== null && options !== void 0 ? options : {});
            return response.json();
        });
    }
    getCredentialsAsHeaders() {
        const credentials = this.getCredentials();
        return credentials
            ? {
                'X-User-Id': credentials['X-User-Id'],
                'X-Auth-Token': credentials['X-Auth-Token'],
            }
            : {};
    }
    send(endpoint, method, _a = {}) {
        var { headers } = _a, options = __rest(_a, ["headers"]);
        return fetch(`${this.baseUrl}${`/${endpoint}`.replace(/\/+/, '/')}`, Object.assign(Object.assign({}, options), { headers: Object.assign(Object.assign(Object.assign({}, this.getCredentialsAsHeaders()), this.headers), headers), method })).then((response) => __awaiter(this, void 0, void 0, function* () {
            if (response.ok) {
                return response;
            }
            if (response.status !== 400) {
                return Promise.reject(response);
            }
            const clone = response.clone();
            const error = yield clone.json();
            if (((0, errors_1.isTotpRequiredError)(error) || (0, errors_1.isTotpInvalidError)(error)) && (0, errors_1.hasRequiredTwoFactorMethod)(error) && this.twoFactorHandler) {
                const method2fa = 'details' in error ? error.details.method : 'password';
                const code = yield this.twoFactorHandler({
                    method: method2fa,
                    emailOrUsername: error.details.emailOrUsername,
                    invalidAttempt: (0, errors_1.isTotpInvalidError)(error),
                });
                return this.send(endpoint, method, Object.assign(Object.assign({}, options), { headers: Object.assign(Object.assign(Object.assign(Object.assign({}, this.getCredentialsAsHeaders()), this.headers), headers), { 'x-2fa-code': code, 'x-2fa-method': method2fa }) }));
            }
            return Promise.reject(response);
        }));
    }
    getParams(data) {
        return data ? (0, query_string_1.stringify)(data, { arrayFormat: 'bracket' }) : '';
    }
    use(middleware) {
        const fn = this.send.bind(this);
        this.send = function (...context) {
            return middleware(context, pipe(fn));
        };
    }
    handleTwoFactorChallenge(cb) {
        this.twoFactorHandler = cb;
    }
}
exports.RestClient = RestClient;
//# sourceMappingURL=index.js.map