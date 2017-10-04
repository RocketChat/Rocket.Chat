Template.livechatIntegrationFacebook.helpers({
	pages() {
		return Template.instance().pages.get();
	},
	subscribed() {
		return this.subscribed ? 'checked' : '';
	},
	enabled() {
		return Template.instance().enabled.get();
	}
});

Template.livechatIntegrationFacebook.onCreated(function() {
	this.enabled = new ReactiveVar(false);
	this.pages = new ReactiveVar([]);

	this.autorun(() => {
		if (this.enabled.get()) {
			Meteor.call('livechat:facebook', { action: 'list-pages' }, (err, result) => {
				console.log('result ->', result);
				this.pages.set(result.pages);
			});
		}
	});
});

Template.livechatIntegrationFacebook.onRendered(function() {
	Meteor.call('livechat:facebook', { action: 'initialState' }, (error, result) => {
		this.enabled.set(result.enabled);
	});
});


Template.livechatIntegrationFacebook.events({
	'click .enable'(event, instance) {
		event.preventDefault();

		Meteor.call('livechat:facebook', { action: 'enable' }, (err, result) => {
			if (err) {
				return handleError(err);
			}
			if (!result.success && result.url) {
				const oauthWindow = window.open(result.url, 'facebook-integration-oauth', 'width=600,height=400');

				const checkInterval = setInterval(() => {
					if (oauthWindow.closed) {
						clearInterval(checkInterval);
						instance.enabled.set(true);
					}
				}, 300);
			} else {
				instance.enabled.set(true);
			}
		});
	},
	'click .disable'(event, instance) {
		event.preventDefault();

		Meteor.call('livechat:facebook', { action: 'disable' }, (err) => {
			if (err) {
				return handleError(err);
			}
			instance.enabled.set(false);
			instance.pages.set([]);
		});
	},
	'change [name=subscribe]'(event, instance) {
		Meteor.call('livechat:facebook', {
			action: !event.currentTarget.checked ? 'unsubscribe' : 'subscribe',
			page: this.id
		}, (err, result) => {
			if (result.success) {
				const pages = instance.pages.get();
				pages.forEach(page => {
					if (page.id === this.id) {
						page.subscribed = event.currentTarget.checked;
					}
				});
				instance.pages.set(pages);
			}
		});
	}
});
