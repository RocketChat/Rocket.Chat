import { Settings } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { trim } from '../../../../lib/utils/stringUtils';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveIntegration'(values: Record<string, any>): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveIntegration'(values) {
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'view-livechat-manager'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveIntegration',
			});
		}
		methodDeprecationLogger.method('livechat:saveIntegration', '7.0.0');

		if (typeof values.Livechat_webhookUrl !== 'undefined') {
			await Settings.updateValueById('Livechat_webhookUrl', trim(values.Livechat_webhookUrl));
		}

		if (typeof values.Livechat_secret_token !== 'undefined') {
			await Settings.updateValueById('Livechat_secret_token', trim(values.Livechat_secret_token));
		}

		if (typeof values.Livechat_http_timeout === 'number') {
			await Settings.updateValueById('Livechat_http_timeout', values.Livechat_http_timeout);
		}

		if (typeof values.Livechat_webhook_on_start !== 'undefined') {
			await Settings.updateValueById('Livechat_webhook_on_start', !!values.Livechat_webhook_on_start);
		}

		if (typeof values.Livechat_webhook_on_close !== 'undefined') {
			await Settings.updateValueById('Livechat_webhook_on_close', !!values.Livechat_webhook_on_close);
		}

		if (typeof values.Livechat_webhook_on_chat_taken !== 'undefined') {
			await Settings.updateValueById('Livechat_webhook_on_chat_taken', !!values.Livechat_webhook_on_chat_taken);
		}

		if (typeof values.Livechat_webhook_on_chat_queued !== 'undefined') {
			await Settings.updateValueById('Livechat_webhook_on_chat_queued', !!values.Livechat_webhook_on_chat_queued);
		}

		if (typeof values.Livechat_webhook_on_forward !== 'undefined') {
			await Settings.updateValueById('Livechat_webhook_on_forward', !!values.Livechat_webhook_on_forward);
		}

		if (typeof values.Livechat_webhook_on_offline_msg !== 'undefined') {
			await Settings.updateValueById('Livechat_webhook_on_offline_msg', !!values.Livechat_webhook_on_offline_msg);
		}

		if (typeof values.Livechat_webhook_on_visitor_message !== 'undefined') {
			await Settings.updateValueById('Livechat_webhook_on_visitor_message', !!values.Livechat_webhook_on_visitor_message);
		}

		if (typeof values.Livechat_webhook_on_agent_message !== 'undefined') {
			await Settings.updateValueById('Livechat_webhook_on_agent_message', !!values.Livechat_webhook_on_agent_message);
		}
	},
});
