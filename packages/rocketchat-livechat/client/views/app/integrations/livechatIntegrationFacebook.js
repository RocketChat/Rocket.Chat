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
			this.loadPages();
		}
	});

	this.result = (successFn, errorFn = () => {}) => {
		return (error, result) => {
			if (error) {
				return swal({
					title: t('Error_loading_pages'),
					text: error.reason,
					type: 'error'
				});
			}
			if (result.success === false && result.type === 'OAuthException') {
				const oauthWindow = window.open(result.url, 'facebook-integration-oauth', 'width=600,height=400');

				const checkInterval = setInterval(() => {
					if (oauthWindow.closed) {
						clearInterval(checkInterval);
						errorFn(error);
					}
				}, 300);
			}
			successFn(result);
		};
	};

	this.loadPages = () => {
		this.pages.set([]);
		Meteor.call('livechat:facebook', { action: 'list-pages' }, this.result((result) => {
			this.pages.set(result.pages);
		}, this.loadPages));
	};
});

Template.livechatIntegrationFacebook.onRendered(function() {
	Meteor.call('livechat:facebook', { action: 'initialState' }, (error, result) => {
		this.enabled.set(result.enabled);
	});
});

Template.livechatIntegrationFacebook.events({
	'click .reload'(event, instance) {
		event.preventDefault();

		instance.loadPages();
	},
	'click .enable'(event, instance) {
		event.preventDefault();

		Meteor.call('livechat:facebook', { action: 'enable' }, this.result(() => {
			instance.enabled.set(true);
		}, () => instance.enabled.set(true)));
	},
	'click .disable'(event, instance) {
		event.preventDefault();

		swal({
			title: t('Disable_Facebook_integration'),
			text: t('Are_you_sure_you_want_to_disable_Facebook_integration'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false
		}, () => {
			Meteor.call('livechat:facebook', { action: 'disable' }, (err) => {
				if (err) {
					return handleError(err);
				}
				instance.enabled.set(false);
				instance.pages.set([]);

				swal({
					title: t('Disabled'),
					text: t('Integration_disabled'),
					type: 'success',
					timer: 2000,
					showConfirmButton: false
				});
			});
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
