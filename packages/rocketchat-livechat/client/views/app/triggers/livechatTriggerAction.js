Template.livechatTriggerAction.helpers({
	hiddenValue(current) {
		if (this.name === undefined && Template.instance().firstAction) {
			Template.instance().firstAction = false;
			return '';
		} else if (this.name !== current) {
			return 'hidden';
		}
	},
	showCustomName() {
		return Template.instance().sender.get() === 'custom' ? '' : 'hidden';
	},
	senderSelected(current) {
		return this.params && this.params.sender === current ? true : false;
	},
	disableIfGuestPool() {
		return RocketChat.settings.get('Livechat_Routing_Method') === 'Guest_Pool';
	}
});

Template.livechatTriggerAction.events({
	'change .trigger-action'(e, instance) {
		instance.$('.trigger-action-value ').addClass('hidden');
		instance.$(`.${ e.currentTarget.value }`).removeClass('hidden');
	},
	'change [name=send-message-sender]'(e, instance) {
		instance.sender.set(e.currentTarget.value);
	}
});

Template.livechatTriggerAction.onCreated(function() {
	this.firstAction = true;

	this.sender = new ReactiveVar('');

	const data = Template.currentData();
	if (data && data.name === 'send-message') {
		this.sender.set(data.params.sender);
	}
});
