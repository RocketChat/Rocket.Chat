import type { SettingValue } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Settings } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { twoFactorRequired } from '../../../2fa/server/twoFactorRequired';
import { getSettingPermissionId } from '../../../authorization/lib';
import { hasPermissionAsync, hasAllPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { notifyOnSettingChanged } from '../lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		saveSetting(_id: string, value: SettingValue, editor?: string): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	saveSetting: twoFactorRequired(async (_id, value, editor) => {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSetting',
			});
		}

		if (
			!(await hasPermissionAsync(uid, 'edit-privileged-setting')) &&
			!(await hasAllPermissionAsync(uid, ['manage-selected-settings', getSettingPermissionId(_id)]))
		) {
			// TODO use the same function
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSetting',
				settingId: _id,
			});
		}

		// Verify the _id passed in is a string.
		check(_id, String);

		const setting = await Settings.findOneById(_id);

		// Verify the value is what it should be
		switch (setting?.type) {
			case 'roomPick':
				check(value, Match.OneOf([Object], ''));
				break;
			case 'boolean':
				check(value, Boolean);
				break;
			case 'int':
				check(value, Number);
				break;
			default:
				check(value, String);
				break;
		}

		(await Settings.updateValueAndEditorById(_id, value as SettingValue, editor)).modifiedCount &&
			setting &&
			void notifyOnSettingChanged({ ...setting, editor, value: value as SettingValue });

		return true;
	}),
});
