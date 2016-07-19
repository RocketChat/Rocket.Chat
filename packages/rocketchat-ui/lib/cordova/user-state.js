if (Meteor.isCordova) {
	document.addEventListener('pause', () => {
		UserPresence.setAway();
		readMessage.disable();
		Meteor.disconnect();
	}, true);

	document.addEventListener('resume', () => {
		Meteor.reconnect();
		UserPresence.setOnline();
		readMessage.enable();
	}, true);
}
