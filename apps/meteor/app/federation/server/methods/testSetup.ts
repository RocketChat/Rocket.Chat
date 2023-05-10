import { Meteor } from 'meteor/meteor';
import { eventTypes } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { getFederationDomain } from '../lib/getFederationDomain';
import { dispatchEvent } from '../handler';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		FEDERATION_Test_Setup(): { message: string };
	}
}

Meteor.methods<ServerMethods>({
	FEDERATION_Test_Setup() {
		try {
			void dispatchEvent([getFederationDomain()], {
				type: eventTypes.PING,
			});

			return {
				message: 'FEDERATION_Test_Setup_Success',
			};
		} catch (err) {
			throw new Meteor.Error('FEDERATION_Test_Setup_Error');
		}
	},
});
