import type { IOAuthApps } from '@rocket.chat/core-typings';
import type { OauthAppsAddParams } from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../../lib/server/lib/deprecationWarningLogger';
import { addOAuthApp } from '../functions/addOAuthApp';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		addOAuthApp: (application: OauthAppsAddParams) => { application: IOAuthApps };
	}
}

Meteor.methods({
	async addOAuthApp(application) {
		methodDeprecationLogger.warn('addOAuthApp is deprecated and will be removed in future versions of Rocket.Chat');

		return addOAuthApp(application, this.userId ?? undefined);
	},
});
