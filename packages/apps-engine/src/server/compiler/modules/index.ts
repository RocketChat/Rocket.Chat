import { moduleHandlerFactory } from './networking';

export enum AllowedInternalModules {
    path = 'path',
    url = 'url',
    crypto = 'crypto',
    buffer = 'buffer',
    stream = 'stream',
    net = 'net',
    http = 'http',
    https = 'https',
    zlib = 'zlib',
    util = 'util',
    punycode = 'punycode',
    os = 'os',
    querystring = 'querystring',
}

export class ForbiddenNativeModuleAccess extends Error {
    constructor(module: string, prop: string) {
        super(`Access to property ${prop} in module ${module} is forbidden`);
    }
}

const defaultHandler = () => ({});

const noopHandler = () => ({
    get: (): undefined => undefined,
});

const proxyHandlers = {
    path: defaultHandler,
    url: defaultHandler,
    crypto: defaultHandler,
    buffer: defaultHandler,
    stream: defaultHandler,
    net: moduleHandlerFactory('net'),
    http: moduleHandlerFactory('http'),
    https: moduleHandlerFactory('https'),
    zlib: defaultHandler,
    util: defaultHandler,
    punycode: defaultHandler,
    os: noopHandler,
    querystring: defaultHandler,
};

export function requireNativeModule(module: AllowedInternalModules, appId: string, requirer: any) {
    const requiredModule = requirer(module);

    return new Proxy(
        requiredModule,
        // Creates a proxy handler that is aware of the appId requiring the module
        Reflect.apply(proxyHandlers[module], undefined, [appId]),
    );
}
