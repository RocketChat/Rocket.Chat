import type { ISetting, ISettingColor } from '@rocket.chat/core-typings';
import { isSettingCode, isSettingColor } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { disableCustomScripts } from './disableCustomScripts';
import { updateAuditedByUser } from '../../../../server/settings/lib/auditedSettingUpdates';
import { getSettingPermissionId } from '../../../authorization/lib';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';
import { checkSettingValueBounds } from '../lib/checkSettingValueBonds';
import { notifyOnSettingChangedById } from '../lib/notifyListener';

const validJSON = Match.Where((value: string) => {
	try {
		value === '' || JSON.parse(value);
		return true;
	} catch (_) {
		throw new Meteor.Error('Invalid JSON provided');
	}
});

const checkInteger = (value: ISetting['value']) => {
	if (!Number.isInteger(value)) {
		throw new Meteor.Error('error-invalid-setting-value', `Invalid setting value ${value}`, {
			method: 'saveSettings',
		});
	}
};

export type SaveSettingsAudit = {
	username: string;
	ip: string;
	useragent: string;
};

export const saveSettingsBulk = async (
	uid: string,
	params: { _id: ISetting['_id']; value: ISetting['value']; editor?: ISettingColor['editor'] }[],
	audit: SaveSettingsAudit,
): Promise<void> => {
	const settingsNotAllowed: ISetting['_id'][] = [];

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

			// Disable custom scripts in cloud trials to prevent phishing campaigns
			if (disableCustomScripts() && /^Custom_Script_/.test(_id)) {
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
				case 'range':
					check(value, Number);
					checkInteger(value);
					checkSettingValueBounds(setting, value);
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

	const auditSettingOperation = updateAuditedByUser({
		_id: uid,
		username: audit.username,
		ip: audit.ip,
		useragent: audit.useragent,
	});

	const promises = params.map(async ({ _id, value, editor }) => {
		const valueResult = await auditSettingOperation(Settings.updateValueById, _id, value);

		if (!editor) {
			return Boolean(valueResult?.modifiedCount);
		}

		const setting = await Settings.findOneById(_id, { projection: { type: 1 } });
		if (!setting || !isSettingColor(setting)) {
			return Boolean(valueResult?.modifiedCount);
		}

		const { modifiedCount } = await Settings.updateOptionsById<ISettingColor>(_id, { editor });
		return Boolean(valueResult?.modifiedCount) || Boolean(modifiedCount);
	});

	(await Promise.all(promises)).forEach((changed, index) => {
		if (changed) {
			void notifyOnSettingChangedById(params[index]._id);
		}
	});
};
