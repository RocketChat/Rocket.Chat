import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { ClientSession } from 'mongodb';

import { trim } from '../../../../lib/utils/stringUtils';
import { onceTransactionCommitedSuccessfully } from '../../../../server/database/utils';
import { settings } from '../../../settings/server';
import { notifyOnSubscriptionChangedByUserIdAndRoomType } from '../lib/notifyListener';

const getCustomFieldsMeta = function (customFieldsMeta: string) {
	try {
		return JSON.parse(customFieldsMeta);
	} catch (e) {
		throw new Meteor.Error('error-invalid-customfield-json', 'Invalid JSON for Custom Fields');
	}
};
export const saveCustomFieldsWithoutValidation = async function (
	userId: string,
	formData: Record<string, any>,
	options?: {
		_updater?: Updater<IUser>;
		session?: ClientSession;
	},
): Promise<void> {
	const customFieldsSetting = settings.get<string>('Accounts_CustomFields');
	if (!customFieldsSetting || trim(customFieldsSetting).length === 0) {
		return;
	}

	// configured custom fields in setting
	const customFieldsMeta = getCustomFieldsMeta(customFieldsSetting);

	const customFields: Record<string, any> = Object.keys(customFieldsMeta).reduce(
		(acc, currentValue) => ({
			...acc,
			[currentValue]: formData[currentValue],
		}),
		{},
	);

	const { _updater, session } = options || {};

	const updater = _updater || Users.getUpdater();

	updater.set('customFields', customFields);

	// add modified records to updater
	Object.keys(customFields).forEach((fieldName) => {
		if (!customFieldsMeta[fieldName].modifyRecordField) {
			return;
		}

		const { modifyRecordField } = customFieldsMeta[fieldName];

		if (modifyRecordField.array) {
			updater.addToSet(modifyRecordField.field, customFields[fieldName]);
		} else {
			updater.set(modifyRecordField.field, customFields[fieldName]);
		}
	});

	if (!_updater) {
		await Users.updateFromUpdater({ _id: userId }, updater, { session });
	}

	await onceTransactionCommitedSuccessfully(async () => {
		const setCustomFieldsResponse = await Subscriptions.setCustomFieldsDirectMessagesByUserId(userId, customFields);
		if (setCustomFieldsResponse.modifiedCount) {
			void notifyOnSubscriptionChangedByUserIdAndRoomType(userId, 'd');
		}
	}, session);
};
