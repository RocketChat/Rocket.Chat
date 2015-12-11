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
