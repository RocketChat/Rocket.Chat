import { check } from 'meteor/check';

import { Storage } from './storage';
import { routes } from './routes';

class Providers extends Storage {
	register(name, options, getUser) {
		check(name, String);
		check(options, {
			// eslint-disable-next-line
			scope: Match.OneOf(String, [String])
		});
		check(getUser, Function);

		this._add(name.toLowerCase(), {
			scope: options.scope,
			getUser
		});
	}
}

const providers = new Providers;

export default providers;

export function middleware(req, res, next) {
	const route = routes.providers(req);

	if (route) {
		const list = [];

		providers.forEach((_, name) => list.push(name));

		res.end(JSON.stringify({
			data: list
		}));
		return;
	}

	next();
}
