Meteor.methods({
	'livechat:facebook'(options) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addAgent' });
		}

		try {
			switch (options.action) {
				case 'initialState': {
					return {
						enabled: RocketChat.settings.get('Livechat_Facebook_Enabled')
					};
				}

				case 'enable': {
					RocketChat.settings.set('Livechat_Facebook_Enabled', true);

					const result = HTTP.call('POST', 'https://omni.rocket.chat/facebook/enable', {
						headers: {
							'authorization': `Bearer ${ RocketChat.settings.get('Livechat_Facebook_API_Key') }`,
							'content-type': 'application/json'
						},
						data: {
							url: RocketChat.settings.get('Site_Url')
						}
					});
					return result.data;
				}

				case 'disable': {
					RocketChat.settings.set('Livechat_Facebook_Enabled', false);

					const result = HTTP.call('DELETE', 'https://omni.rocket.chat/facebook/enable', {
						headers: {
							'authorization': `Bearer ${ RocketChat.settings.get('Livechat_Facebook_API_Key') }`,
							'content-type': 'application/json'
						}
					});
					return result.data;
				}

				case 'list-pages': {
					const result = HTTP.call('GET', 'https://omni.rocket.chat/facebook/pages', {
						headers: {
							'authorization': `Bearer ${ RocketChat.settings.get('Livechat_Facebook_API_Key') }`
						}
					});
					return result.data;
				}

				case 'subscribe': {
					const result = HTTP.call('POST', `https://omni.rocket.chat/facebook/page/${ options.page }/subscribe`, {
						headers: {
							'authorization': `Bearer ${ RocketChat.settings.get('Livechat_Facebook_API_Key') }`
						}
					});
					return result.data;
				}

				case 'unsubscribe': {
					const result = HTTP.call('DELETE', `https://omni.rocket.chat/facebook/page/${ options.page }/subscribe`, {
						headers: {
							'authorization': `Bearer ${ RocketChat.settings.get('Livechat_Facebook_API_Key') }`
						}
					});
					return result.data;
				}
			}
		} catch (e) {
			if (e.response && e.response.data && e.response.data.error && e.response.data.error.message) {
				throw new Meteor.Error('integration-error', e.response.data.error.message);
			}
			throw new Meteor.Error('integration-error', e.error);
		}
	}
});
