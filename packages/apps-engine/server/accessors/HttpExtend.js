"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExtend = void 0;
class HttpExtend {
    constructor() {
        this.headers = new Map();
        this.params = new Map();
        this.requests = [];
        this.responses = [];
    }
    provideDefaultHeader(key, value) {
        this.headers.set(key, value);
    }
    provideDefaultHeaders(headers) {
        Object.keys(headers).forEach((key) => this.headers.set(key, headers[key]));
    }
    provideDefaultParam(key, value) {
        this.params.set(key, value);
    }
    provideDefaultParams(params) {
        Object.keys(params).forEach((key) => this.params.set(key, params[key]));
    }
    providePreRequestHandler(handler) {
        this.requests.push(handler);
    }
    providePreResponseHandler(handler) {
        this.responses.push(handler);
    }
    getDefaultHeaders() {
        return new Map(this.headers);
    }
    getDefaultParams() {
        return new Map(this.params);
    }
    getPreRequestHandlers() {
        return Array.from(this.requests);
    }
    getPreResponseHandlers() {
        return Array.from(this.responses);
    }
}
exports.HttpExtend = HttpExtend;
//# sourceMappingURL=HttpExtend.js.map