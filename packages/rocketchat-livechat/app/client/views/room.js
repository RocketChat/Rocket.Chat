Template.room.helpers({
	title: function() {
		var ref;
		if (!Template.instance().subscriptionsReady()) {
			return '';
		}
		return ((ref = Settings.findOne('Livechat_title')) != null ? ref.value : void 0) || 'Rocket.Chat';
	},
	color: function() {
		var ref;
		if (!Template.instance().subscriptionsReady()) {
			return 'transparent';
		}
		return ((ref = Settings.findOne('Livechat_title_color')) != null ? ref.value : void 0) || '#C1272D';
	},
	popoutActive: function() {
		return FlowRouter.getQueryParam('mode') === 'popout';
	},
	showMessages: function() {
		return Session.get('triggered') || Meteor.userId();
	},
	livechatStartedEnabled: function() {
		return Template.instance().startedEnabled.get() !== null;
	},
	livechatEnabled: function() {
		return Template.instance().startedEnabled.get();
	}
});

Template.room.events({
	'click .title': function() {
		parentCall('toggleWindow');
	},
	'click .popout': function(event) {
		event.stopPropagation();
		parentCall('openPopout');
	}
});

Template.room.onCreated(function() {
	self = this;

	self.startedEnabled = new ReactiveVar(null);

	self.subscribe('settings', ['Livechat_title', 'Livechat_title_color', 'Livechat_enabled']);

	var initialCheck = true;

	self.autorun(function() {
		if (self.subscriptionsReady()) {
			var enabled = Settings.findOne('Livechat_enabled');
			if (enabled !== undefined) {
				if (!enabled.value && initialCheck) {
					parentCall('removeWidget');
				}
				initialCheck = false;
				self.startedEnabled.set(enabled.value);
			}
		}
	});
});
