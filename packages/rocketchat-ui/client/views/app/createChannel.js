Template.createChannel.helpers({
	createIsDisabled() {
		if (document.getElementById('create-channel-input').value === '') {
			return 'disabled';
		}

		return false;
	}
});
