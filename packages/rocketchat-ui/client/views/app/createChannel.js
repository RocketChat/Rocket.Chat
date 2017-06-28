Template.createChannel.helpers({
	createIsDisabled() {
		if (Template.instance().channelName.get() === '') {
			return 'disabled';
		}

		return '';
	}
});

Template.createChannel.events({
	'input #create-channel-input'(e, t) {
		t.channelName.set(e.target.value);
	}
});

Template.createChannel.onCreated(function() {
	this.channelName = new ReactiveVar('');
});
