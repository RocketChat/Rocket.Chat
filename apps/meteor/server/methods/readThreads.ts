import type { IMessage, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';
import { readThreadMethod } from '../../app/threads/server/functions';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		readThreads(tmid: IMessage['_id']): void;
	}
}

Meteor.methods<ServerMethods>({
	async readThreads(tmid) {
		methodDeprecationLogger.method('readThreads', '9.0.0', '/v1/subscriptions.read');
		check(tmid, String);

		const user = (await Meteor.userAsync()) as IUser | null;
		if (!user) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'readThreads' });
		}

		await readThreadMethod({ user, tmid });
	},
});
