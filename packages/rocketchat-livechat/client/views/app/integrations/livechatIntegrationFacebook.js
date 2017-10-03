Template.livechatIntegrationFacebook.helpers({
	pages() {
		return Template.instance().pages.get();
	},
	subscribed() {
		return this.subscribed ? 'checked' : '';
	}
});

Template.livechatIntegrationFacebook.onCreated(function() {
	this.enabled = new ReactiveVar(false);
	this.pages = new ReactiveVar([
		{id: 123, name: 'Fake Page Nro 1', subscribed: false },
		{id: 1234, name: 'Fake Page Nro 2', subscribed: true },
		{id: 1235, name: 'Fake Page Nro 3', subscribed: true },
		{id: 1236, name: 'Fake Page Nro 4', subscribed: false }
	]);

	this.autorun(() => {
		if (this.enabled.get()) {
			Meteor.call('livechat:facebook', { action: 'list-pages' }, (err, result) => {
				console.log('result ->', result);
				this.pages.set(result.pages);
			});
		}
	});
});

Template.livechatIntegrationFacebook.events({
	'click .enable'(event, instance) {
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
