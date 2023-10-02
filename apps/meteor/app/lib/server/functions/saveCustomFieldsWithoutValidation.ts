import type { IUser, DeepWritable } from '@rocket.chat/core-typings';
import { Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { UpdateFilter } from 'mongodb';

import { trim } from '../../../../lib/utils/stringUtils';
import { settings } from '../../../settings/server';

export const saveCustomFieldsWithoutValidation = async function (userId: string, formData: Record<string, any>): Promise<void> {
	if (trim(settings.get('Accounts_CustomFields')) !== '') {
		let customFieldsMeta;
		try {
			customFieldsMeta = JSON.parse(settings.get('Accounts_CustomFields'));
		} catch (e) {
			throw new Meteor.Error('error-invalid-customfield-json', 'Invalid JSON for Custom Fields');
		}

		const customFields: Record<string, any> = {};
		Object.keys(customFieldsMeta).forEach((key) => {
			customFields[key] = formData[key];
		});
		await Users.setCustomFields(userId, customFields);

		// Update customFields of all Direct Messages' Rooms for userId
		await Subscriptions.setCustomFieldsDirectMessagesByUserId(userId, customFields);

		for await (const fieldName of Object.keys(customFields)) {
			if (!customFieldsMeta[fieldName].modifyRecordField) {
				return;
			}

			const { modifyRecordField } = customFieldsMeta[fieldName];
			const update: DeepWritable<UpdateFilter<IUser>> = {};
			if (modifyRecordField.array) {
				update.$addToSet = {};
				update.$addToSet[modifyRecordField.field] = customFields[fieldName];
			} else {
				update.$set = {};
				update.$set[modifyRecordField.field] = customFields[fieldName];
			}

			await Users.updateOne({ _id: userId }, update);
		}
	}
};
