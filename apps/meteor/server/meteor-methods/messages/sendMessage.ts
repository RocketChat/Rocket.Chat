import { api } from '@rocket.chat/core-services';
import type { AtLeast, IMessage, IUser } from '@rocket.chat/core-typings';
import type { RocketchatI18nKeys } from '@rocket.chat/i18n';
import { Messages, Users } from '@rocket.chat/models';
import type { TOptions } from 'i18next';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import { canSendMessageAsync } from '../../lib/authorization/canSendMessage';
import { i18n } from '../../lib/i18n';
import { SystemLogger } from '../../lib/logger/system';
import { sendMessage } from '../../lib/messages/sendMessage';
import { metrics } from '../../lib/metrics';
import { settings } from '../../settings';
/**
 *
 * @param uid
 * @param message
 * @param extraInfo
 *   - ts: The timestamp of the message. the message object already has a ts, but this value is validated and only a window of 10 seconds is allowed to be used. this value overrides the message.ts value without validation.
 *
 *
 * @returns
 */
export async function executeSendMessage(
	uid: IUser['_id'] | IUser,
	message: AtLeast<IMessage, 'rid'>,
	extraInfo?: { ts?: Date; previewUrls?: string[] },
) {
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

	const isTimestampFromClient = Boolean(!extraInfo?.ts && message.ts);
	const now = new Date();
	message.ts = extraInfo?.ts ?? message.ts ?? now;
	if (isTimestampFromClient) {
		const tsDiff = Math.abs(moment(message.ts).diff(Date.now()));
		if (tsDiff > 60000) {
			throw new Meteor.Error('error-message-ts-out-of-sync', 'Message timestamp is out of sync', {
				method: 'sendMessage',
				message_ts: message.ts,
				server_ts: new Date().getTime(),
			});
		}
		if (tsDiff > 10000) {
			message.ts = now;
		}
	}

	if (message.msg) {
		if (message.msg.length > (settings.get<number>('Message_MaxAllowedSize') ?? 0)) {
			throw new Meteor.Error('error-message-size-exceeded', 'Message size exceeds Message_MaxAllowedSize', {
				method: 'sendMessage',
			});
		}
	}

	const user = typeof uid === 'string' ? await Users.findOneById(uid) : uid;
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
		const room = await canSendMessageAsync(rid, user);

		if (room.encrypted && settings.get<boolean>('E2E_Enable') && !settings.get<boolean>('E2E_Allow_Unencrypted_Messages')) {
			if (message.t !== 'e2e') {
				throw new Meteor.Error('error-not-allowed', 'Not allowed to send un-encrypted messages in an encrypted room', {
					method: 'sendMessage',
				});
			}
		}

		const result = await sendMessage(user, message, room, { previewUrls: extraInfo?.previewUrls });

		metrics.messagesSent.inc();
		metrics.messagesSentTotal.inc();

		return result;
	} catch (err: any) {
		SystemLogger.error({ msg: 'Error sending message:', err });

		const errorMessage: RocketchatI18nKeys = typeof err === 'string' ? err : err.error || err.message;
		const errorContext: TOptions = err.details ?? {};
		void api.broadcast('notify.ephemeralMessage', user._id, message.rid, {
			msg: i18n.t(errorMessage, { ...errorContext, lng: user.language }),
		});

		if (typeof err === 'string') {
			throw new Error(err);
		}

		throw err;
	}
}
