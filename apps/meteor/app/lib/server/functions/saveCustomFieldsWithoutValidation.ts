import { Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { trim } from '../../../../lib/utils/stringUtils';
import { settings } from '../../../settings/server';
import { notifyOnSubscriptionChangedByUserIdAndRoomType } from '../lib/notifyListener';

const getCustomFieldsMeta = function (customFieldsMeta: string) {
	try {
		return JSON.parse(customFieldsMeta);
	} catch (e) {
		throw new Meteor.Error('error-invalid-customfield-json', 'Invalid JSON for Custom Fields');
	}
};
export const saveCustomFieldsWithoutValidation = async function (userId: string, formData: Record<string, any>): Promise<void> {
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

	const updater = Users.getUpdater();

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

	await Users.updateFromUpdater({ _id: userId }, updater);

	// Update customFields of all Direct Messages' Rooms for userId
	const setCustomFieldsResponse = await Subscriptions.setCustomFieldsDirectMessagesByUserId(userId, customFields);
	if (setCustomFieldsResponse.modifiedCount) {
		void notifyOnSubscriptionChangedByUserIdAndRoomType(userId, 'd');
	}
};
