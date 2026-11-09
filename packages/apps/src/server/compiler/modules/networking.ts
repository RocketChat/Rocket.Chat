import type * as http from 'node:http';
import type * as https from 'node:https';
import type * as net from 'node:net';

import { ForbiddenNativeModuleAccess } from './index.js';
import { PermissionDeniedError } from '../../errors/PermissionDeniedError.js';
import { AppPermissionManager } from '../../managers/AppPermissionManager.js';
import { AppPermissions } from '../../permissions/AppPermissions.js';

type IHttp = typeof http;
type IHttps = typeof https;
type INet = typeof net;

type NetworkingLibs = IHttp | IHttps | INet;

const networkingModuleBlockList = ['createServer', 'Server'];

export const moduleHandlerFactory = (module: string) => {
	return (appId: string): ProxyHandler<NetworkingLibs> => ({
		get(target, prop: string, receiver): unknown {
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
