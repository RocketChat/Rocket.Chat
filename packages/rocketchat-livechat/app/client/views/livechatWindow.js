Template.livechatWindow.helpers({
	title() {
		var ref;
		if (!Template.instance().subscriptionsReady()) {
			return '';
		}
		return ((ref = Settings.findOne('Livechat_title')) != null ? ref.value : void 0) || 'Rocket.Chat';
	},
	color() {
		var ref;
		if (!Template.instance().subscriptionsReady()) {
			return 'transparent';
		}
		return ((ref = Settings.findOne('Livechat_title_color')) != null ? ref.value : void 0) || '#C1272D';
	},
	popoutActive() {
		return FlowRouter.getQueryParam('mode') === 'popout';
	},
	showRegisterForm() {
		if (Session.get('triggered') || Meteor.userId()) {
			return false;
		}
		var form = Settings.findOne('Livechat_registration_form');
		return form.value;
	},
	livechatStartedEnabled() {
		return Template.instance().startedEnabled.get() !== null;
	},
	livechatEnabled() {
		return Template.instance().startedEnabled.get();
	}
});

Template.livechatWindow.events({
	'click .title'() {
		parentCall('toggleWindow');
	},
	'click .popout'(event) {
		event.stopPropagation();
		parentCall('openPopout');
	}
});

Template.livechatWindow.onCreated(function() {
	this.startedEnabled = new ReactiveVar(null);

	this.subscribe('settings', ['Livechat_title', 'Livechat_title_color', 'Livechat_enabled', 'Livechat_registration_form']);

	var initialCheck = true;

	this.autorun(() => {
		if (this.subscriptionsReady()) {
			var enabled = Settings.findOne('Livechat_enabled');
			if (enabled !== undefined) {
				if (!enabled.value && initialCheck) {
					parentCall('removeWidget');
				}
				initialCheck = false;
				this.startedEnabled.set(enabled.value);
			}
		}
	});
});
