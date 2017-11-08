Template.livechatIntegrationFacebook.helpers({
	pages() {
		return Template.instance().pages.get();
	},
	subscribed() {
		return this.subscribed ? 'checked' : '';
	},
	enabled() {
		return Template.instance().enabled.get();
	},
	hasToken() {
		return Template.instance().hasToken.get();
	},
	enableButtonDisabled() {
		return !Template.instance().hasToken.get() ? 'disabled' : '';
	},
	isLoading() {
		return Template.instance().loading.get();
	}
});

Template.livechatIntegrationFacebook.onCreated(function() {
	this.enabled = new ReactiveVar(false);
	this.hasToken = new ReactiveVar(false);
	this.pages = new ReactiveVar([]);
	this.loading = new ReactiveVar(false);

	this.autorun(() => {
		if (this.enabled.get()) {
			this.loadPages();
		}
	});

	this.result = (successFn, errorFn = () => {}) => {
		return (error, result) => {
			if (result.success === false && (result.type === 'OAuthException' || typeof result.url !== 'undefined')) {
				const oauthWindow = window.open(result.url, 'facebook-integration-oauth', 'width=600,height=400');

				const checkInterval = setInterval(() => {
					if (oauthWindow.closed) {
						clearInterval(checkInterval);
						errorFn(error);
					}
				}, 300);
				return;
			}
			if (error) {
				errorFn(error);
				return swal({
					title: t('Error_loading_pages'),
					text: error.reason,
					type: 'error'
				});
			}
			successFn(result);
		};
	};

	this.loadPages = () => {
		this.pages.set([]);
		this.loading.set(true);
		Meteor.call('livechat:facebook', { action: 'list-pages' }, this.result((result) => {
			this.pages.set(result.pages);
			this.loading.set(false);
		}, () => this.loading.set(false)));
	};
});

Template.livechatIntegrationFacebook.onRendered(function() {
	this.loading.set(true);
	Meteor.call('livechat:facebook', { action: 'initialState' }, this.result((result) => {
		this.enabled.set(result.enabled);
		this.hasToken.set(result.hasToken);
		this.loading.set(false);
	}));
});

Template.livechatIntegrationFacebook.events({
	'click .reload'(event, instance) {
		event.preventDefault();

		instance.loadPages();
	},
	'click .enable'(event, instance) {
		event.preventDefault();

		Meteor.call('livechat:facebook', { action: 'enable' }, instance.result(() => {
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
