import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Match, check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { setAvatarFromServiceWithValidation } from '../../app/lib/server/functions/setUserAvatar';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		setAvatarFromService(dataURI: Buffer | Blob, contentType?: string, service?: string, targetUserId?: string): void;
	}
}

Meteor.methods<ServerMethods>({
	async setAvatarFromService(dataURI, contentType, service, targetUserId) {
		check(dataURI, String);
		check(contentType, Match.Optional(String));
		check(service, Match.Optional(String));
		check(targetUserId, Match.Optional(String));

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setAvatarFromService',
			});
		}

		return setAvatarFromServiceWithValidation(uid, dataURI, contentType, service, targetUserId);
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'setAvatarFromService',
		userId() {
			return true;
		},
	},
	1,
	5000,
);
