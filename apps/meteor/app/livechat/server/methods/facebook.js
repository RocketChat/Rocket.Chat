import { Meteor } from 'meteor/meteor';
import { Settings } from '@rocket.chat/models';

import { hasPermission } from '../../../authorization';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import OmniChannel from '../lib/OmniChannel';

Meteor.methods({
	'livechat:facebook'(options) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addAgent' });
		}

		try {
			switch (options.action) {
				case 'initialState': {
					return {
						enabled: settings.get('Livechat_Facebook_Enabled'),
						hasToken: !!settings.get('Livechat_Facebook_API_Key'),
					};
				}

				case 'enable': {
					const result = OmniChannel.enable();

					if (!result.success) {
						return result;
					}

					return Settings.updateValueById('Livechat_Facebook_Enabled', true);
				}

				case 'disable': {
					OmniChannel.disable();

					return Settings.updateValueById('Livechat_Facebook_Enabled', false);
				}

				case 'list-pages': {
					return OmniChannel.listPages();
				}

				case 'subscribe': {
					return OmniChannel.subscribe(options.page);
				}

				case 'unsubscribe': {
					return OmniChannel.unsubscribe(options.page);
				}
			}
		} catch (err) {
			if (err.response && err.response.data && err.response.data.error) {
				if (err.response.data.error.error) {
					throw new Meteor.Error(err.response.data.error.error, err.response.data.error.message);
				}
				if (err.response.data.error.response) {
					throw new Meteor.Error('integration-error', err.response.data.error.response.error.message);
				}
				if (err.response.data.error.message) {
					throw new Meteor.Error('integration-error', err.response.data.error.message);
				}
			}
			SystemLogger.error({ msg: 'Error contacting omni.rocket.chat:', err });
			throw new Meteor.Error('integration-error', err.error);
		}
	},
});
