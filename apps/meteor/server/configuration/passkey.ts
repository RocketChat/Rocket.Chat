import type { Awaited } from '@rocket.chat/core-typings';
import debounce from 'lodash.debounce';
import { RoutePolicy } from 'meteor/routepolicy';
import { WebApp } from 'meteor/webapp';

import { settings } from '../../app/settings/server/cached';
import { loginHandlerCAS } from '../lib/cas/loginHandler';
import { middlewareCAS } from '../lib/cas/middleware';
import { updateCasServices } from '../lib/cas/updateCasService';
import { Meteor } from 'meteor/meteor';
import { passkey } from '/app/passkey/server';
import { API } from '/app/api/server';
import { ICachedSettings } from '/app/settings/server/CachedSettings';

export async function configurePasskey(setting: ICachedSettings) { // TODO fzh075 setting
	// const _updateCasServices = debounce(updateCasServices, 2000);
	//
	// settings.watchByRegex(/^CAS_.+/, async () => {
	// 	await _updateCasServices();
	// });
// 	TODO: Fix registerLoginHandler's type definitions (it accepts promises) (The same problem occurs in Rocket.Chat/apps/meteor/server/configuration/cas.ts)
	Accounts.registerLoginHandler("passkey", async (loginRequest) => {
		if (!loginRequest.id || !loginRequest.authenticationResponse) {
			return undefined;
		}

		const userId = await passkey.verifyAuthenticationResponse(loginRequest.id, loginRequest.authenticationResponse)
		return { userId };
	});
}
