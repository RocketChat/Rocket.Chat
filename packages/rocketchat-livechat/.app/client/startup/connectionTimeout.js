import visitor from '../../imports/client/visitor';

const docActivityEvents = ['mousemove', 'mousedown', 'touchend', 'keydown'];
let timer, connectionTimeout;

const stopTimer = () => {
	clearTimeout(timer);
};

const startTimer = () => {
	stopTimer();
	timer = setTimeout(setAway, connectionTimeout);
};

const setOnline = () => {
	const connectionStatus = Meteor.status();
	if (!connectionStatus.connected) {
		Meteor.reconnect();
		Meteor.call('livechat:updateVisitorStatus', visitor.getToken(), 'online');

	};

	startTimer();
};

const setAway = () => {
	const connectionStatus = Meteor.status();
	if (connectionStatus.connected) {
		Meteor.disconnect()
	};

	stopTimer();
};

const startEvents = () => {
	docActivityEvents.forEach((event) => {
		document.addEventListener(event, setOnline);
	});

	window.addEventListener('focus', setOnline);
};

const stopEvents = () => {
	docActivityEvents.forEach((event) => {
		document.removeEventListener(event, setOnline);
	});

	window.removeEventListener('focus', setOnline);

	stopTimer();
};

Meteor.startup(() => {
	Tracker.autorun(function() {
		connectionTimeout = visitor.getIdleTimeoutDisconnect();
		(connectionTimeout > 0) ? startEvents() : stopEvents();
	});
});
