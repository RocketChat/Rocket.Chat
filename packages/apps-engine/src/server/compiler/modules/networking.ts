import type * as http from 'http';
import type * as https from 'https';
import type * as net from 'net';

import { ForbiddenNativeModuleAccess } from '.';
import { PermissionDeniedError } from '../../errors/PermissionDeniedError';
import { AppPermissionManager } from '../../managers/AppPermissionManager';
import { AppPermissions } from '../../permissions/AppPermissions';

type IHttp = typeof http;
type IHttps = typeof https;
type INet = typeof net;

type NetworkingLibs = IHttp | IHttps | INet;

const networkingModuleBlockList = ['createServer', 'Server'];

export const moduleHandlerFactory = (module: string) => {
    return (appId: string): ProxyHandler<NetworkingLibs> => ({
        get(target, prop: string, receiver) {
            if (networkingModuleBlockList.includes(prop)) {
                throw new ForbiddenNativeModuleAccess(module, prop);
            }

            if (!AppPermissionManager.hasPermission(appId, AppPermissions.networking.default)) {
                throw new PermissionDeniedError({
                    appId,
                    missingPermissions: [AppPermissions.networking.default],
                    methodName: `${module}.${prop}`,
                });
            }

            return Reflect.get(target, prop, receiver);
        },
    });
};
