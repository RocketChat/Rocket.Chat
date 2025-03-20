import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatCustomField } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveCustomField'(
			_id: string,
			customFieldData: {
				field: string;
				label: string;
				scope: 'visitor' | 'room';
				visibility: string;
				regexp: string;
				searchable: boolean;
			},
		): ILivechatCustomField;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveCustomField'(_id, customFieldData) {
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'view-livechat-manager'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveCustomField',
			});
		}

		if (_id) {
			check(_id, String);
		}

		check(
			customFieldData,
			Match.ObjectIncluding({
				field: String,
				label: String,
				scope: String,
				visibility: String,
				regexp: String,
				searchable: Boolean,
			}),
		);

		if (!/^[0-9a-zA-Z-_]+$/.test(customFieldData.field)) {
			throw new Meteor.Error(
				'error-invalid-custom-field-name',
				'Invalid custom field name. Use only letters, numbers, hyphens and underscores.',
				{ method: 'livechat:saveCustomField' },
			);
		}

		if (_id) {
			const customField = await LivechatCustomField.findOneById(_id);
			if (!customField) {
				throw new Meteor.Error('error-invalid-custom-field', 'Custom Field Not found', {
					method: 'livechat:saveCustomField',
				});
			}
		}

		if (!_id) {
			const customField = await LivechatCustomField.findOneById(customFieldData.field);
			if (customField) {
				throw new Meteor.Error('error-custom-field-name-already-exists', 'Custom field name already exists', {
					method: 'livechat:saveCustomField',
				});
			}
		}

		const { field, label, scope, visibility, ...extraData } = customFieldData;
		return LivechatCustomField.createOrUpdateCustomField(_id, field, label, scope, visibility, {
			...extraData,
		});
	},
});
