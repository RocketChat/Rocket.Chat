"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenNativeModuleAccess = exports.AllowedInternalModules = void 0;
exports.requireNativeModule = requireNativeModule;
const networking_1 = require("./networking");
var AllowedInternalModules;
(function (AllowedInternalModules) {
    AllowedInternalModules["path"] = "path";
    AllowedInternalModules["url"] = "url";
    AllowedInternalModules["crypto"] = "crypto";
    AllowedInternalModules["buffer"] = "buffer";
    AllowedInternalModules["stream"] = "stream";
    AllowedInternalModules["net"] = "net";
    AllowedInternalModules["http"] = "http";
    AllowedInternalModules["https"] = "https";
    AllowedInternalModules["zlib"] = "zlib";
    AllowedInternalModules["util"] = "util";
    AllowedInternalModules["punycode"] = "punycode";
    AllowedInternalModules["os"] = "os";
    AllowedInternalModules["querystring"] = "querystring";
})(AllowedInternalModules || (exports.AllowedInternalModules = AllowedInternalModules = {}));
class ForbiddenNativeModuleAccess extends Error {
    constructor(module, prop) {
        super(`Access to property ${prop} in module ${module} is forbidden`);
    }
}
exports.ForbiddenNativeModuleAccess = ForbiddenNativeModuleAccess;
const defaultHandler = () => ({});
const noopHandler = () => ({
    get: () => undefined,
});
const proxyHandlers = {
    path: defaultHandler,
    url: defaultHandler,
    crypto: defaultHandler,
    buffer: defaultHandler,
    stream: defaultHandler,
    net: (0, networking_1.moduleHandlerFactory)('net'),
    http: (0, networking_1.moduleHandlerFactory)('http'),
    https: (0, networking_1.moduleHandlerFactory)('https'),
    zlib: defaultHandler,
    util: defaultHandler,
    punycode: defaultHandler,
    os: noopHandler,
    querystring: defaultHandler,
};
function requireNativeModule(module, appId, requirer) {
    const requiredModule = requirer(module);
    return new Proxy(requiredModule, 
    // Creates a proxy handler that is aware of the appId requiring the module
    Reflect.apply(proxyHandlers[module], undefined, [appId]));
}
//# sourceMappingURL=index.js.map