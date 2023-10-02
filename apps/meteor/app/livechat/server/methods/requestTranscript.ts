import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { Livechat } from '../lib/Livechat';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:requestTranscript'(rid: string, email: string, subject: string): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:requestTranscript'(rid, email, subject) {
		methodDeprecationLogger.method('livechat:requestTranscript', '7.0.0');
		check(rid, String);
		check(email, String);

		const userId = Meteor.userId();

		if (!userId || !(await hasPermissionAsync(userId, 'send-omnichannel-chat-transcript'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:requestTranscript',
			});
		}

		const user = await Users.findOneById(userId, {
			projection: { _id: 1, username: 1, name: 1, utcOffset: 1 },
		});

		await Livechat.requestTranscript({ rid, email, subject, user });

		return true;
	},
});
