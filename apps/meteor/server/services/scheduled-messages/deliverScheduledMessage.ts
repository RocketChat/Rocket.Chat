import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage, IScheduledMessage, IUser } from '@rocket.chat/core-typings';
import { Messages, Uploads, Users } from '@rocket.chat/models';

import { canSendMessageAsync } from '../../lib/authorization/canSendMessage';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { applyAirGappedRestrictionsValidation } from '../../lib/cloud/license/airGappedRestrictionsWrapper';
import { sendFileMessage } from '../../meteor-methods/messages/sendFileMessage';
import { executeSendMessage } from '../../meteor-methods/messages/sendMessage';

const sendFiles = async ({ u, rid, msg, tmid, files = [] }: IScheduledMessage, type: IUser['type']): Promise<IMessage> => {
	await canSendMessageAsync(rid, { uid: u._id, username: u.username, type });

	for await (const [index, { _id, description }] of files.entries()) {
		const file = await Uploads.findOneByIdAndUserIdAndRoomId(_id, u._id, rid);
		if (!file) {
			throw new ClientSafeError('invalid-file');
		}
		await applyAirGappedRestrictionsValidation(() =>
			sendFileMessage(u._id, {
				roomId: rid,
				file: { ...file, ...(description && { description }) },
				msgData: { msg: index === 0 ? msg : '', ...(tmid && { tmid }) },
			}),
		);
	}

	const message = await Messages.getMessageByFileIdAndUsername(files[0]._id, u._id);
	if (!message) {
		throw new ClientSafeError('invalid-file');
	}
	return message;
};

export const deliverScheduledMessage = async (item: IScheduledMessage): Promise<IMessage> => {
	const { u, rid, msg, tmid, tshow, files } = item;
	if (!(await hasPermissionAsync(u._id, 'schedule-message', rid))) {
		throw new ClientSafeError('error-not-allowed');
	}
	const author = await Users.findOneById<Pick<IUser, '_id' | 'active' | 'type'>>(u._id, { projection: { active: 1, type: 1 } });
	if (!author?.active) {
		throw new ClientSafeError('error-invalid-user');
	}

	if (files?.length) {
		return sendFiles(item, author.type);
	}

	return applyAirGappedRestrictionsValidation(() => executeSendMessage(u._id, { rid, msg, ...(tmid && { tmid, tshow }) }));
};
