import OmniChannel from '../lib/OmniChannel';

Meteor.methods({
	'livechat:facebook'(options) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addAgent' });
		}

		try {
			switch (options.action) {
				case 'initialState': {
					return {
						enabled: RocketChat.settings.get('Livechat_Facebook_Enabled'),
						hasToken: !!RocketChat.settings.get('Livechat_Facebook_API_Key')
					};
				}

				case 'enable': {
					const result = OmniChannel.enable();

					if (!result.success) {
						return result;
					}

					return RocketChat.settings.updateById('Livechat_Facebook_Enabled', true);
				}

				case 'disable': {
					OmniChannel.disable();

					return RocketChat.settings.updateById('Livechat_Facebook_Enabled', false);
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
		} catch (e) {
			if (e.response && e.response.data && e.response.data.error) {
				if (e.response.data.error.error) {
					throw new Meteor.Error(e.response.data.error.error, e.response.data.error.message);
				}
				if (e.response.data.error.response) {
					throw new Meteor.Error('integration-error', e.response.data.error.response.error.message);
				}
				if (e.response.data.error.message) {
					throw new Meteor.Error('integration-error', e.response.data.error.message);
				}
			}
			console.error('Error contacting omni.rocket.chat:', e);
			throw new Meteor.Error('integration-error', e.error);
		}
	}
});
