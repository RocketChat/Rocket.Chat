export declare enum AllowedInternalModules {
    path = "path",
    url = "url",
    crypto = "crypto",
    buffer = "buffer",
    stream = "stream",
    net = "net",
    http = "http",
    https = "https",
    zlib = "zlib",
    util = "util",
    punycode = "punycode",
    os = "os",
    querystring = "querystring"
}
export declare class ForbiddenNativeModuleAccess extends Error {
    constructor(module: string, prop: string);
}
export declare function requireNativeModule(module: AllowedInternalModules, appId: string, requirer: any): any;
