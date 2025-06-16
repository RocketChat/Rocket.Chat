import { api } from '@rocket.chat/core-services';
import type { AtLeast, IMessage, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import type { RocketchatI18nKeys } from '@rocket.chat/i18n';
import { Messages, Users } from '@rocket.chat/models';
import type { TOptions } from 'i18next';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import { i18n } from '../../../../server/lib/i18n';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { canSendMessageAsync } from '../../../authorization/server/functions/canSendMessage';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { applyAirGappedRestrictionsValidation } from '../../../license/server/airGappedRestrictionsWrapper';
import { metrics } from '../../../metrics/server';
import { settings } from '../../../settings/server';
import { MessageTypes } from '../../../ui-utils/server';
import { sendMessage } from '../functions/sendMessage';
import { RateLimiter } from '../lib';

export async function executeSendMessage(uid: IUser['_id'], message: AtLeast<IMessage, 'rid'>, previewUrls?: string[]) {
	if (message.tshow && !message.tmid) {
		throw new Meteor.Error('invalid-params', 'tshow provided but missing tmid', {
			method: 'sendMessage',
		});
	}

	if (message.tmid && !settings.get('Threads_enabled')) {
		throw new Meteor.Error('error-not-allowed', 'not-allowed', {
			method: 'sendMessage',
		});
	}

	if (message.ts) {
		const tsDiff = Math.abs(moment(message.ts).diff(Date.now()));
		if (tsDiff > 60000) {
			throw new Meteor.Error('error-message-ts-out-of-sync', 'Message timestamp is out of sync', {
				method: 'sendMessage',
				message_ts: message.ts,
				server_ts: new Date().getTime(),
			});
		} else if (tsDiff > 10000) {
			message.ts = new Date();
		}
	} else {
		message.ts = new Date();
	}

	if (message.msg) {
		if (message.msg.length > (settings.get<number>('Message_MaxAllowedSize') ?? 0)) {
			throw new Meteor.Error('error-message-size-exceeded', 'Message size exceeds Message_MaxAllowedSize', {
				method: 'sendMessage',
			});
		}
	}

	const user = await Users.findOneById(uid, {
		projection: {
			username: 1,
			type: 1,
			name: 1,
		},
	});
	if (!user?.username) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	let { rid } = message;

	// do not allow nested threads
	if (message.tmid) {
		const parentMessage = await Messages.findOneById(message.tmid, { projection: { rid: 1, tmid: 1 } });
		message.tmid = parentMessage?.tmid || message.tmid;

		if (parentMessage?.rid) {
			rid = parentMessage?.rid;
		}
	}

	if (!rid) {
		throw new Error("The 'rid' property on the message object is missing.");
	}

	check(rid, String);

	try {
		const room = await canSendMessageAsync(rid, { uid, username: user.username, type: user.type });

		if (room.encrypted && settings.get<boolean>('E2E_Enable') && !settings.get<boolean>('E2E_Allow_Unencrypted_Messages')) {
			if (message.t !== 'e2e') {
				throw new Meteor.Error('error-not-allowed', 'Not allowed to send un-encrypted messages in an encrypted room', {
					method: 'sendMessage',
				});
			}
		}

		metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736
		return await sendMessage(user, message, room, false, previewUrls);
	} catch (err: any) {
		SystemLogger.error({ msg: 'Error sending message:', err });

		const errorMessage: RocketchatI18nKeys = typeof err === 'string' ? err : err.error || err.message;
		const errorContext: TOptions = err.details ?? {};
		void api.broadcast('notify.ephemeralMessage', uid, message.rid, {
			msg: i18n.t(errorMessage, { ...errorContext, lng: user.language }),
		});

		if (typeof err === 'string') {
			throw new Error(err);
		}

		throw err;
	}
}

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		sendMessage(message: AtLeast<IMessage, '_id' | 'rid' | 'msg'>, previewUrls?: string[]): any;
	}
}

Meteor.methods<ServerMethods>({
	async sendMessage(message, previewUrls) {
		check(message, {
			_id: Match.Maybe(String),
			rid: Match.Maybe(String),
			msg: Match.Maybe(String),
			tmid: Match.Maybe(String),
			tshow: Match.Maybe(Boolean),
			ts: Match.Maybe(Date),
			t: Match.Maybe(String),
			otrAck: Match.Maybe(String),
			bot: Match.Maybe(Object),
			content: Match.Maybe(Object),
			e2e: Match.Maybe(String),
			e2eMentions: Match.Maybe(Object),
			customFields: Match.Maybe(Object),
			federation: Match.Maybe(Object),
			groupable: Match.Maybe(Boolean),
			sentByEmail: Match.Maybe(Boolean),
		});

		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'sendMessage',
			});
		}

		if (MessageTypes.isSystemMessage(message)) {
			throw new Error("Cannot send system messages using 'sendMessage'");
		}

		try {
			return await applyAirGappedRestrictionsValidation(() => executeSendMessage(uid, message, previewUrls));
		} catch (error: any) {
			if (['error-not-allowed', 'restricted-workspace'].includes(error.error || error.message)) {
				throw new Meteor.Error(error.error || error.message, error.reason, {
					method: 'sendMessage',
				});
			}
		}
	},
});
// Limit a user, who does not have the "bot" role, to sending 5 msgs/second
RateLimiter.limitMethod('sendMessage', 5, 1000, {
	async userId(userId: IUser['_id']) {
		return !(await hasPermissionAsync(userId, 'send-many-messages'));
	},
});
