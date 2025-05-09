import { Subscriptions, Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { notifyOnSubscriptionChangedById } from '../../../lib/server/lib/notifyListener';

export const saveAutoTranslateSettings = async (
	userId: string,
	rid: string,
	field: string,
	value: string,
	options: { defaultLanguage: string },
) => {
	if (!(await hasPermissionAsync(userId, 'auto-translate'))) {
		throw new Meteor.Error('error-action-not-allowed', 'Auto-Translate is not allowed', {
			method: 'autoTranslate.saveSettings',
		});
	}

	check(rid, String);
	check(field, String);
	check(value, String);

	if (['autoTranslate', 'autoTranslateLanguage'].indexOf(field) === -1) {
		throw new Meteor.Error('error-invalid-settings', 'Invalid settings field', {
			method: 'saveAutoTranslateSettings',
		});
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userId);
	if (!subscription) {
		throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
			method: 'saveAutoTranslateSettings',
		});
	}

	let shouldNotifySubscriptionChanged = false;

	switch (field) {
		case 'autoTranslate':
			const room = await Rooms.findE2ERoomById(rid, { projection: { _id: 1 } });
			if (room && value === '1') {
				throw new Meteor.Error('error-e2e-enabled', 'Enabling auto-translation in E2E encrypted rooms is not allowed', {
					method: 'saveAutoTranslateSettings',
				});
			}

			const updateAutoTranslateResponse = await Subscriptions.updateAutoTranslateById(subscription._id, value === '1');
			if (updateAutoTranslateResponse.modifiedCount) {
				shouldNotifySubscriptionChanged = true;
			}

			if (!subscription.autoTranslateLanguage && options.defaultLanguage) {
				const updateAutoTranslateLanguageResponse = await Subscriptions.updateAutoTranslateLanguageById(
					subscription._id,
					options.defaultLanguage,
				);
				if (updateAutoTranslateLanguageResponse.modifiedCount) {
					shouldNotifySubscriptionChanged = true;
				}
			}

			break;
		case 'autoTranslateLanguage':
			const updateAutoTranslateLanguage = await Subscriptions.updateAutoTranslateLanguageById(subscription._id, value);
			if (updateAutoTranslateLanguage.modifiedCount) {
				shouldNotifySubscriptionChanged = true;
			}
			break;
	}

	if (shouldNotifySubscriptionChanged) {
		void notifyOnSubscriptionChangedById(subscription._id);
	}

	return true;
};
