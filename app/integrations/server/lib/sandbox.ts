import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';
import Fiber from 'fibers';
import { Livechat } from 'meteor/rocketchat:livechat';
import { HTTP } from 'meteor/http';

import * as Models from '../../../models';

export function buildSandbox(store: Record<any, any> = {}): Record<any, any> {
	const sandbox = {
		scriptTimeout(reject: any): any {
			return setTimeout(() => reject('timed out'), 3000);
		},
		_,
		s,
		console,
		moment,
		Fiber,
		Promise,
		Livechat,
		Store: {
			set(key: any, val: any): any {
				store[key] = val;
				return val;
			},
			get(key: any): any {
				return store[key];
			},
		},
		HTTP(method: any, url: any, options: any): any {
			try {
				return {
					result: HTTP.call(method, url, options),
				};
			} catch (error) {
				return {
					error,
				};
			}
		},
	};

	const keys = Object.keys(Models).filter((key) => !key.startsWith('_'));

	keys.forEach((key) => {
		sandbox[key as keyof typeof sandbox] = Models[key as keyof typeof Models];
	});

	return { store, sandbox	};
}
