Meteor.startup(() => {
	function onPause() {
		Meteor.disconnect();
	}

	function onResume() {
		Meteor.reconnect();
	}

	if (Meteor.isCordova) {
		document.addEventListener('pause', onPause, true);
		document.addEventListener('resume', onResume, true);
	}
});
