import type { App } from '@rocket.chat/apps-engine/definition/App.ts';

import { RequestContext } from './requestContext.ts';
import { isApp } from '../handlers/lib/assertions.ts';

export function wrapAppForRequest(app: App, req: RequestContext): App {
	return new Proxy(app, {
		get(target, property, receiver) {
			if (property === 'logger') {
				return req.context.logger;
			}

			return Reflect.get(target, property, receiver);
		},
	});
}

function hasAppProperty(v: NonNullable<unknown>): v is { app: App } {
	return isApp((v as unknown as { app?: App }).app);
}

export function wrapComposedApp<T extends NonNullable<unknown>>(composed: T, req: RequestContext): T {
	if (!hasAppProperty(composed)) {
		return composed;
	}

	const proxy = wrapAppForRequest(composed.app, req);

	return new Proxy(composed, {
		get(target, property, receiver) {
			if (property === 'app') {
				return proxy;
			}

			return Reflect.get(target, property, receiver);
		},
	})
}
