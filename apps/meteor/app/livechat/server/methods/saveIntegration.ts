import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { trim } from '../../../../lib/utils/stringUtils';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveIntegration'(values: Record<string, any>): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveIntegration'(values) {
		methodDeprecationLogger.method('livechat:saveIntegration', '7.0.0');

		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'view-livechat-manager'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveIntegration',
			});
		}

		const settingsIds = [
			typeof values.Livechat_webhookUrl !== 'undefined' && { _id: 'Livechat_webhookUrl', value: trim(values.Livechat_webhookUrl) },
			typeof values.Livechat_secret_token !== 'undefined' && { _id: 'Livechat_secret_token', value: trim(values.Livechat_secret_token) },
			typeof values.Livechat_http_timeout !== 'undefined' && { _id: 'Livechat_http_timeout', value: values.Livechat_http_timeout },
			typeof values.Livechat_webhook_on_start !== 'undefined' && {
				_id: 'Livechat_webhook_on_start',
				value: !!values.Livechat_webhook_on_start,
			},
			typeof values.Livechat_webhook_on_close !== 'undefined' && {
				_id: 'Livechat_webhook_on_close',
				value: !!values.Livechat_webhook_on_close,
			},
			typeof values.Livechat_webhook_on_forward !== 'undefined' && {
				_id: 'Livechat_webhook_on_forward',
				value: !!values.Livechat_webhook_on_forward,
			},
			typeof values.Livechat_webhook_on_chat_taken !== 'undefined' && {
				_id: 'Livechat_webhook_on_chat_taken',
				value: !!values.Livechat_webhook_on_chat_taken,
			},
			typeof values.Livechat_webhook_on_chat_queued !== 'undefined' && {
				_id: 'Livechat_webhook_on_chat_queued',
				value: !!values.Livechat_webhook_on_chat_queued,
			},
			typeof values.Livechat_webhook_on_offline_msg !== 'undefined' && {
				_id: 'Livechat_webhook_on_offline_msg',
				value: !!values.Livechat_webhook_on_offline_msg,
			},
			typeof values.Livechat_webhook_on_visitor_message !== 'undefined' && {
				_id: 'Livechat_webhook_on_visitor_message',
				value: !!values.Livechat_webhook_on_visitor_message,
			},
			typeof values.Livechat_webhook_on_agent_message !== 'undefined' && {
				_id: 'Livechat_webhook_on_agent_message',
				value: !!values.Livechat_webhook_on_agent_message,
			},
		].filter(Boolean) as unknown as { _id: string; value: any }[];

		const promises = settingsIds.map((setting) => Settings.updateValueById(setting._id, setting.value));

		(await Promise.all(promises)).forEach((value, index) => {
			if (value?.modifiedCount) {
				void notifyOnSettingChangedById(settingsIds[index]._id);
			}
		});
	},
});
