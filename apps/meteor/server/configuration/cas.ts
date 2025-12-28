import type { Awaited } from '@rocket.chat/core-typings';
import debounce from 'lodash.debounce';
import { RoutePolicy } from 'meteor/routepolicy';
import { WebApp } from 'meteor/webapp';

import type { ICachedSettings } from '../../app/settings/server/CachedSettings';
import { loginHandlerCAS } from '../lib/cas/loginHandler';
import { middlewareCAS } from '../lib/cas/middleware';
import { updateCasServices } from '../lib/cas/updateCasService';

export async function configureCAS(settings: ICachedSettings) {
	const _updateCasServices = debounce(updateCasServices, 2000);

	settings.watchByRegex(/^CAS_.+/, async () => {
		await _updateCasServices();
	});

	RoutePolicy.declare('/_cas/', 'network');

	// Listen to incoming OAuth http requests
	WebApp.connectHandlers.use((req, res, next) => {
		middlewareCAS(req, res, next);
	});

	/*
	 * Register a server-side login handler.
	 * It is called after Accounts.callLoginMethod() is called from client.
	 *
	 */
	Accounts.registerLoginHandler('cas', (options) => {
		const promise = loginHandlerCAS(options);

		// Pretend the promise has been awaited so the types will match -
		// #TODO: Fix registerLoginHandler's type definitions (it accepts promises)
		return promise as unknown as Awaited<typeof promise>;
	});
}
