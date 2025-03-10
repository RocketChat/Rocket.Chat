import { Apps, AppEvents } from '@rocket.chat/apps';
import type { ILivechatVisitor } from '@rocket.chat/core-typings';
import {
	LivechatVisitors,
	LivechatCustomField,
	LivechatInquiry,
	LivechatRooms,
	Messages,
	ReadReceipts,
	Subscriptions,
} from '@rocket.chat/models';

import { livechatLogger } from './logger';
import { trim } from '../../../../lib/utils/stringUtils';
import { i18n } from '../../../../server/lib/i18n';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { FileUpload } from '../../../file-upload/server';
import { notifyOnSubscriptionChanged, notifyOnLivechatInquiryChanged } from '../../../lib/server/lib/notifyListener';

export async function saveGuest(
	guestData: Pick<ILivechatVisitor, '_id' | 'name' | 'livechatData'> & { email?: string; phone?: string },
	userId: string,
) {
	const { _id, name, email, phone, livechatData = {} } = guestData;

	const visitor = await LivechatVisitors.findOneById(_id, { projection: { _id: 1 } });
	if (!visitor) {
		throw new Error('error-invalid-visitor');
	}

	livechatLogger.debug({ msg: 'Saving guest', guestData });
	const updateData: {
		name?: string | undefined;
		username?: string | undefined;
		email?: string | undefined;
		phone?: string | undefined;
		livechatData: {
			[k: string]: any;
		};
	} = { livechatData: {} };

	if (name) {
		updateData.name = name;
	}
	if (email) {
		updateData.email = email;
	}
	if (phone) {
		updateData.phone = phone;
	}

	const customFields: Record<string, any> = {};

	if ((!userId || (await hasPermissionAsync(userId, 'edit-livechat-room-customfields'))) && Object.keys(livechatData).length) {
		livechatLogger.debug({ msg: `Saving custom fields for visitor ${_id}`, livechatData });
		for await (const field of LivechatCustomField.findByScope('visitor')) {
			if (!livechatData.hasOwnProperty(field._id)) {
				continue;
			}
			const value = trim(livechatData[field._id]);
			if (value !== '' && field.regexp !== undefined && field.regexp !== '') {
				const regexp = new RegExp(field.regexp);
				if (!regexp.test(value)) {
					throw new Error(i18n.t('error-invalid-custom-field-value'));
				}
			}
			customFields[field._id] = value;
		}
		updateData.livechatData = customFields;
		livechatLogger.debug(`About to update ${Object.keys(customFields).length} custom fields for visitor ${_id}`);
	}
	const ret = await LivechatVisitors.saveGuestById(_id, updateData);

	setImmediate(() => {
		void Apps.self?.triggerEvent(AppEvents.IPostLivechatGuestSaved, _id);
	});

	return ret;
}

export async function removeGuest(_id: string) {
	const guest = await LivechatVisitors.findOneEnabledById(_id, { projection: { _id: 1, token: 1 } });
	if (!guest) {
		throw new Error('error-invalid-guest');
	}

	await cleanGuestHistory(guest.token);
	return LivechatVisitors.disableById(_id);
}

async function cleanGuestHistory(token: string) {
	// This shouldn't be possible, but just in case
	if (!token) {
		throw new Error('error-invalid-guest');
	}

	const cursor = LivechatRooms.findByVisitorToken(token);
	for await (const room of cursor) {
		await Promise.all([
			Subscriptions.removeByRoomId(room._id, {
				async onTrash(doc) {
					void notifyOnSubscriptionChanged(doc, 'removed');
				},
			}),
			FileUpload.removeFilesByRoomId(room._id),
			Messages.removeByRoomId(room._id),
			ReadReceipts.removeByRoomId(room._id),
		]);
	}

	await LivechatRooms.removeByVisitorToken(token);

	const livechatInquiries = await LivechatInquiry.findIdsByVisitorToken(token).toArray();
	await LivechatInquiry.removeByIds(livechatInquiries.map(({ _id }) => _id));
	void notifyOnLivechatInquiryChanged(livechatInquiries, 'removed');
}
