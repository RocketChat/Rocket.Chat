import { api, ClientSafeError } from '@rocket.chat/core-services';
import type { AtLeast, IMessage, IUser } from '@rocket.chat/core-typings';
import type { RocketchatI18nKeys } from '@rocket.chat/i18n';
import { Messages, Users } from '@rocket.chat/models';
import type { TOptions } from 'i18next';
import moment from 'moment';

import { canSendMessageAsync } from '../../lib/authorization/canSendMessage';
import { i18n } from '../../lib/i18n';
import { SystemLogger } from '../../lib/logger/system';
import { sendMessage } from '../../lib/messages/sendMessage';
import { metrics } from '../../lib/metrics';
import { settings } from '../../settings';

function applyMessageTimestamp(message: AtLeast<IMessage, 'rid'>, extraInfo?: { ts?: Date }) {
	const isTimestampFromClient = Boolean(!extraInfo?.ts && message.ts);
	const now = new Date();
	message.ts = extraInfo?.ts ?? message.ts ?? now;
	if (!isTimestampFromClient) {
		return;
	}

	const tsDiff = Math.abs(moment(message.ts).diff(Date.now()));
	if (tsDiff > 60000) {
		throw new ClientSafeError('error-message-ts-out-of-sync', 'Message timestamp is out of sync', {
			method: 'sendMessage',
			message_ts: message.ts,
			server_ts: new Date().getTime(),
		});
	}

	if (tsDiff > 10000) {
		message.ts = now;
	}
}

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
		throw new ClientSafeError('invalid-params', 'tshow provided but missing tmid', {
			method: 'sendMessage',
		});
	}

	if (message.tmid && !settings.get('Threads_enabled')) {
		throw new ClientSafeError('error-not-allowed', 'not-allowed', {
			method: 'sendMessage',
		});
	}

	applyMessageTimestamp(message, extraInfo);

	if (message.msg && message.msg.length > (settings.get<number>('Message_MaxAllowedSize') ?? 0)) {
		throw new ClientSafeError('error-message-size-exceeded', 'Message size exceeds Message_MaxAllowedSize', {
			method: 'sendMessage',
		});
	}

	const user = typeof uid === 'string' ? await Users.findOneById(uid) : uid;
	if (!user?.username) {
		throw new ClientSafeError('error-invalid-user', 'Invalid user');
	}

	let { rid } = message;

	// do not allow nested threads
	if (message.tmid) {
		const parentMessage = await Messages.findOneById(message.tmid, { projection: { rid: 1, tmid: 1 } });
		message.tmid = parentMessage?.tmid || message.tmid;
		rid = parentMessage?.rid || rid;
	}

	if (!rid) {
		throw new Error("The 'rid' property on the message object is missing.");
	}

	try {
		const room = await canSendMessageAsync(rid, user);

		if (
			room.encrypted &&
			message.t !== 'e2e' &&
			settings.get<boolean>('E2E_Enable') &&
			!settings.get<boolean>('E2E_Allow_Unencrypted_Messages')
		) {
			throw new ClientSafeError('error-not-allowed', 'Not allowed to send un-encrypted messages in an encrypted room', {
				method: 'sendMessage',
			});
		}

		const result = await sendMessage(user, message, room, { previewUrls: extraInfo?.previewUrls });

		metrics.messagesSent.inc();
		metrics.messagesSentTotal.inc();

		// oxlint-disable-next-line typescript/no-unsafe-return -- lib sendMessage is untyped (any parameters, any result)
		return result;
	} catch (err: any) {
		SystemLogger.error({ msg: 'Error sending message:', err });

		const errorMessage: RocketchatI18nKeys = typeof err === 'string' ? err : err.error || err.message;
		const errorContext: TOptions = err.details ?? {};
		void api.broadcast('notify.ephemeralMessage', user._id, message.rid, {
			msg: i18n.t(errorMessage, { ...errorContext, lng: user.language }),
		});

		if (typeof err === 'string') {
			throw new Error(err, { cause: err });
		}

		throw err;
	}
}
