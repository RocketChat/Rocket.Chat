import { Apps, AppEvents } from '@rocket.chat/apps';
import type { ILivechatVisitor } from '@rocket.chat/core-typings';
import { LivechatVisitors, LivechatCustomField } from '@rocket.chat/models';

import { livechatLogger } from './logger';
import { trim } from '../../../../lib/utils/stringUtils';
import { i18n } from '../../../../server/lib/i18n';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

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
