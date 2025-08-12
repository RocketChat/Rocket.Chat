import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatCustomField } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { DeleteResult } from 'mongodb';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:removeCustomField'(_id: string): DeleteResult;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:removeCustomField'(_id) {
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'view-livechat-manager'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeCustomField',
			});
		}

		check(_id, String);

		const customField = await LivechatCustomField.findOneById(_id, { projection: { _id: 1 } });
		if (!customField) {
			throw new Meteor.Error('error-invalid-custom-field', 'Custom field not found', {
				method: 'livechat:removeCustomField',
			});
		}

		return LivechatCustomField.removeById(_id);
	},
});
