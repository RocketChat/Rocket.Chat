Meteor.publish('livechat:appearancetexts', function() {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:appearancetexts' }));
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:appearancetexts' }));
	}

	const query = {
		identifier: {
			$in: [
				'Livechat_title',
				'Livechat_offline_form_unavailable',
				'Livechat_offline_message',
				'Livechat_offline_success_message',
				'Livechat_offline_title'
			]
		}
	};

	const self = this;

	const handle = RocketChat.models.LivechatTexts.find(query).observeChanges({
		added(id, fields) {
			self.added('livechatAppearanceTexts', id, fields);
		},
		changed(id, fields) {
			self.changed('livechatAppearanceTexts', id, fields);
		},
		removed(id) {
			self.removed('livechatAppearanceTexts', id);
		}
	});

	this.ready();

	this.onStop(() => {
		handle.stop();
	});
});
