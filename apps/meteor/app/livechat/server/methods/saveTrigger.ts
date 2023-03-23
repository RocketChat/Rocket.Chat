import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { LivechatTrigger } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { ILivechatTrigger } from '@rocket.chat/core-typings';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveTrigger'(trigger: ILivechatTrigger): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveTrigger'(trigger) {
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'view-livechat-manager'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveTrigger',
			});
		}

		check(trigger, {
			_id: Match.Maybe(String),
			name: String,
			description: String,
			enabled: Boolean,
			runOnce: Boolean,
			conditions: Array,
			actions: Array,
		});

		if (trigger._id) {
			await LivechatTrigger.updateById(trigger._id, trigger);
			return true;
		}
		await LivechatTrigger.insertOne(trigger);

		return true;
	},
});
