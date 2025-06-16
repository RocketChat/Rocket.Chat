import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { saveCustomFields } from '../functions/saveCustomFields';
import { RateLimiter } from '../lib';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		saveCustomFields: (fields: IUser['customFields']) => Promise<void>;
	}
}

Meteor.methods<ServerMethods>({
	async saveCustomFields(fields = {}) {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'saveCustomFields' });
		}
		await saveCustomFields(uid, fields);
	},
});

RateLimiter.limitMethod('saveCustomFields', 1, 1000, {
	userId() {
		return true;
	},
});
