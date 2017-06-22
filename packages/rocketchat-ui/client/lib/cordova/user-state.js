/* globals UserPresence, readMessage */

let timer = undefined;
if (Meteor.isCordova) {
	document.addEventListener('pause', () => {
		UserPresence.setAway();
		readMessage.disable();

		//Only disconnect after one minute of being in the background
		timer = setTimeout(() => {
			Meteor.disconnect();
			timer = undefined;
		}, 60000);
	}, true);

	document.addEventListener('resume', () => {
		if (!_.isUndefined(timer)) {
			clearTimeout(timer);
		}

		Meteor.reconnect();
		UserPresence.setOnline();
		readMessage.enable();
	}, true);
}
