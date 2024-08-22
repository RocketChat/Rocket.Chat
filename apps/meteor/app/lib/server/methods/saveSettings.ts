import type { ISetting } from '@rocket.chat/core-typings';
import { isSettingCode } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Settings } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';
import { getSettingPermissionId } from '../../../authorization/lib';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';
import { notifyOnSettingChangedById } from '../lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		saveSettings(
			changes: {
				_id: ISetting['_id'];
				value: ISetting['value'];
			}[],
		): Promise<boolean>;
	}
}

const validJSON = Match.Where((value: string) => {
	try {
		value === '' || JSON.parse(value);
		return true;
	} catch (_) {
		throw new Meteor.Error('Invalid JSON provided');
	}
});

Meteor.methods<ServerMethods>({
	saveSettings: twoFactorRequired(
		async (
			params: {
				_id: ISetting['_id'];
				value: ISetting['value'];
			}[] = [],
		) => {
			const uid = Meteor.userId();
			const settingsNotAllowed: ISetting['_id'][] = [];
			if (uid === null) {
				throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
					method: 'saveSetting',
				});
			}
			const editPrivilegedSetting = await hasPermissionAsync(uid, 'edit-privileged-setting');
			const manageSelectedSettings = await hasPermissionAsync(uid, 'manage-selected-settings');

			// if the id contains Organization_Name then change the Site_Name
			const orgName = params.find(({ _id }) => _id === 'Organization_Name');

			if (orgName) {
				// check if the site name is still the default value or ifs the same as organization name
				const siteName = await Settings.findOneById('Site_Name');

				if (siteName?.value === siteName?.packageValue || siteName?.value === settings.get('Organization_Name')) {
					params.push({
						_id: 'Site_Name',
						value: orgName.value,
					});
				}
			}

			await Promise.all(
				params.map(async ({ _id, value }) => {
					// Verify the _id passed in is a string.
					check(_id, String);
					if (!editPrivilegedSetting && !(manageSelectedSettings && (await hasPermissionAsync(uid, getSettingPermissionId(_id))))) {
						return settingsNotAllowed.push(_id);
					}

					const setting = await Settings.findOneById(_id);
					// Verify the value is what it should be
					switch (setting?.type) {
						case 'roomPick':
							check(value, Match.OneOf([Object], ''));
							break;
						case 'boolean':
							check(value, Boolean);
							break;
						case 'timespan':
						case 'int':
							check(value, Number);
							if (!Number.isInteger(value)) {
								throw new Meteor.Error(`Invalid setting value ${value}`, 'Invalid setting value', {
									method: 'saveSettings',
								});
							}

							break;
						case 'multiSelect':
							check(value, Array);
							break;
						case 'code':
							check(value, String);
							if (isSettingCode(setting) && setting.code === 'application/json') {
								check(value, validJSON);
							}
							break;
						default:
							check(value, String);
							break;
					}
				}),
			);

			if (settingsNotAllowed.length) {
				throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
					method: 'saveSettings',
					settingIds: settingsNotAllowed,
				});
			}

			const promises = params.map(({ _id, value }) => Settings.updateValueById(_id, value));

			(await Promise.all(promises)).forEach((value, index) => {
				if (value?.modifiedCount) {
					void notifyOnSettingChangedById(params[index]._id);
				}
			});

			return true;
		},
		{},
	),
});
