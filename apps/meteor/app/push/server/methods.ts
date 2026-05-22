import { Push } from '@rocket.chat/core-services';
import type { IPushToken } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { PushToken } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { logger } from './logger';
import { _matchToken } from './push';

type PushUpdateOptions = {
	id?: string;
	token: IPushToken['token'];
	authToken: string;
	appName: string;
	userId: string | null;
	metadata?: Record<string, unknown>;
};
declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'raix:push-update'(options: PushUpdateOptions): Promise<Omit<IPushToken, 'authToken'>>;
		'raix:push-setuser'(options: { id: string; userId: string }): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async 'raix:push-update'(options) {
		logger.debug({ msg: 'Got push token from app', options });

		check(options, {
			id: Match.Optional(String),
			token: _matchToken,
			authToken: String,
			appName: String,
			userId: Match.OneOf(String, null),
			metadata: Match.Optional(Object),
		});

		// The if user id is set then user id should match on client and connection
		if (!this.userId || (options.userId && options.userId !== this.userId)) {
			throw new Meteor.Error(403, 'Forbidden access');
		}

		// Retain old behavior: if id is not specified but userId is explicitly set, then update the user's first token
		if (!options.id && options.userId) {
			const firstDoc = await PushToken.findFirstByUserId(options.userId, { projection: { _id: 1 } });
			if (firstDoc) {
				options.id = firstDoc._id;
			}
		}

		const authToken = Accounts._hashLoginToken(options.authToken);

		return Push.registerPushToken({
			...(options.id && { _id: options.id }),
			token: options.token,
			appName: options.appName,
			authToken,
			userId: this.userId,
			...(options.metadata && { metadata: options.metadata }),
		});
	},
	// Deprecated
	async 'raix:push-setuser'(id) {
		check(id, String);
		if (!this.userId) {
			throw new Meteor.Error(403, 'Forbidden access');
		}

		logger.debug({ msg: 'Setting userId for app', userId: this.userId, appId: id });
		const found = await PushToken.updateOne({ _id: id }, { $set: { userId: this.userId } });

		return !!found;
	},
});
