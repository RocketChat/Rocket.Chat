Meteor.methods({
	'livechat:facebook'(options) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addAgent' });
		}

		switch (options.action) {
			case 'enable': {
				const result = HTTP.call('POST', 'http://localhost:3000/facebook/enable', {
					headers: {
						'x-rocketchat-instance': RocketChat.settings.get('uniqueID'),
						'content-type': 'application/json'
					},
					data: {
						url: RocketChat.settings.get('Site_Url')
					}
				});
				console.log('result ->', result);
				return result.data;
			}

			case 'list-pages': {
				const result = HTTP.call('GET', 'http://localhost:3000/facebook/pages', {
					headers: {
						'x-rocketchat-instance': RocketChat.settings.get('uniqueID')
					}
				});
				console.log('result ->', result);
				return result.data;
			}

			case 'subscribe': {
				const result = HTTP.call('POST', `http://localhost:3000/facebook/page/${ options.page }/subscribe`, {
					headers: {
						'x-rocketchat-instance': RocketChat.settings.get('uniqueID')
					}
				});
				console.log('result ->', result);
				return result.data;
			}

			case 'unsubscribe': {
				const result = HTTP.call('DELETE', `http://localhost:3000/facebook/page/${ options.page }/subscribe`, {
					headers: {
						'x-rocketchat-instance': RocketChat.settings.get('uniqueID')
					}
				});
				console.log('result ->', result);
				return result.data;
			}
		}
	}
});
