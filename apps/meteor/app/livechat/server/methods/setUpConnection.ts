import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { Livechat } from '../lib/Livechat';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:setUpConnection'(data: { token: string }): void;
	}
}

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		interface Connection {
			livechatToken?: string;
		}
	}
}

Meteor.methods<ServerMethods>({
	'livechat:setUpConnection'(data) {
		check(data, {
			token: String,
		});

		const { token } = data;

		if (this.connection && !this.connection.livechatToken) {
			this.connection.livechatToken = token;
			this.connection.onClose(async () => {
				await Livechat.notifyGuestStatusChanged(token, 'offline');
			});
		}
	},
});
