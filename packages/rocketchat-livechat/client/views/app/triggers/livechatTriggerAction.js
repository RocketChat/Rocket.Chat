Template.livechatTriggerAction.helpers({
	hiddenValue(current) {
		if (this.name === undefined && Template.instance().firstAction) {
			Template.instance().firstAction = false;
			return '';
		} else if (this.name !== current) {
			return 'hidden';
		}
	}
});

Template.livechatTriggerAction.events({
	'change .trigger-action'(e, instance) {
		instance.$('.trigger-action-value ').addClass('hidden');
		instance.$('.' + e.currentTarget.value).removeClass('hidden');
	}
});

Template.livechatTriggerAction.onCreated(function() {
	this.firstAction = true;
});
