import * as Models from '@rocket.chat/models';
import moment from 'moment';
import _ from 'underscore';

import * as s from '../../../../../lib/utils/stringUtils';
import { deasyncPromise } from '../../../../../server/deasync/deasync';
import { httpCall } from '../../../../../server/lib/http/call';

const forbiddenModelMethods: readonly (keyof typeof Models)[] = ['registerModel', 'getCollectionName'];

type ModelName = Exclude<keyof typeof Models, (typeof forbiddenModelMethods)[number]>;

export type Vm2Sandbox<IsIncoming extends boolean> = {
	scriptTimeout: (reject: (reason?: any) => void) => ReturnType<typeof setTimeout>;
	_: typeof _;
	s: typeof s;
	console: typeof console;
	moment: typeof moment;
	Promise: typeof Promise;
	Store: {
		set: IsIncoming extends true ? (key: string, value: any) => any : (key: string, value: any) => void;
		get: (key: string) => any;
	};
	HTTP: (method: string, url: string, options: Record<string, any>) => unknown;
} & (IsIncoming extends true ? { Livechat: undefined } : never) &
	Record<ModelName, (typeof Models)[ModelName]>;

export const buildSandbox = <IsIncoming extends boolean>(
	store: Record<string, any>,
	isIncoming?: IsIncoming,
): {
	store: Record<string, any>;
	sandbox: Vm2Sandbox<IsIncoming>;
} => {
	const httpAsync = async (method: string, url: string, options: Record<string, any>) => {
		try {
			return {
				result: await httpCall(method, url, options),
			};
		} catch (error) {
			return { error };
		}
	};

	const sandbox = {
		scriptTimeout(reject: (reason?: any) => void) {
			return setTimeout(() => reject('timed out'), 3000);
		},
		_,
		s,
		console,
		moment,
		Promise,
		// There's a small difference between the sandbox that is sent to incoming and to outgoing scripts
		// Technically we could unify this but since we're deprecating vm2 anyway I'm keeping this old behavior here until the feature is removed completely
		...(isIncoming
			? {
					Livechat: undefined,
					Store: {
						set: (key: string, val: any): any => {
							store[key] = val;
							return val;
						},
						get: (key: string) => store[key],
					},
			  }
			: {
					Store: {
						set: (key: string, val: any): void => {
							store[key] = val;
						},
						get: (key: string) => store[key],
					},
			  }),
		HTTP: (method: string, url: string, options: Record<string, any>) => {
			// TODO: deprecate, track and alert
			return deasyncPromise(httpAsync(method, url, options));
		},
	} as Vm2Sandbox<IsIncoming>;

	(Object.keys(Models) as ModelName[])
		.filter((k) => !forbiddenModelMethods.includes(k))
		.forEach((k) => {
			sandbox[k] = Models[k];
		});

	return { store, sandbox };
};
