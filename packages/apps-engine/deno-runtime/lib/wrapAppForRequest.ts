import type { App } from '@rocket.chat/apps-engine/definition/App.ts';

import { RequestContext } from './requestContext.ts';
import { isApp, isRecord } from '../handlers/lib/assertions.ts';

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

// Instances of objects that have a reference to an App instance won't change throughout the
// lifetime of the runtime, so we can cache the results to avoid iterating the same object multiple times
const composedCache = new WeakMap<NonNullable<unknown>, ReturnType<typeof findAppProperty>>();

function findAppProperty(v: NonNullable<unknown>): [string, App] | undefined {
	const cachedEntry = composedCache.get(v);

	if (cachedEntry) {
		return cachedEntry;
	}

	if (!isRecord(v)) {
		// Enables us to avoid having to determine whether the value is a record again
		composedCache.set(v, undefined);
		return undefined;
	}

	const entry = Object.entries(v).find(([_,v]) => isApp(v)) as [string, App] | undefined;

	composedCache.set(v, entry);

	return entry;
}

export function wrapComposedApp<T extends NonNullable<unknown>>(composed: T, req: RequestContext): T {
	const prop = findAppProperty(composed);

	if (!prop) {
		return composed;
	}

	const proxy = wrapAppForRequest(prop[1], req);

	return new Proxy(composed, {
		get(target, property, receiver) {
			if (property === prop[0]) {
				return proxy;
			}

			return Reflect.get(target, property, receiver);
		},
	})
}
