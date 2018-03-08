const getMedia = () => navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
const createAndConnect = (url) => {
	if (!'WebSocket' in window) { // eslint-disable-line no-negated-in-lhs
		return false;
	}

	const ws = new WebSocket(url);
	ws.onerror = (evt) => console.error(`Error: ${ evt.data }`);
	return ws;
};
const sendMessageToWebSocket = (message, ws) => {
	if (ws != null) {
		if (ws.readyState === 1) { ws.send(message); }
	}
};

Template.broadcastView.helpers({
	broadcastSource() {
		return Template.instance().mediaStream.get() ? window.URL.createObjectURL(Template.instance().mediaStream.get()) : '';
	},
	mediaRecorder() {
		Template.instance().mediaRecorder.get();
	}
});

Template.broadcastView.onCreated(async function() {
	this.mediaStream = new ReactiveVar(null);
	this.mediaRecorder = new ReactiveVar(null);
	this.connection = new ReactiveVar(createAndConnect(`ws://localhost:3001/${ this.data.id }`));
});
Template.broadcastView.onDestroyed(function() {
	if (this.connection.get()) {
		this.connection.get().close();
	}
	if (this.mediaRecorder.get()) {
		this.mediaRecorder.get().stop();
	}
	this.mediaStream.set(null);
});
Template.broadcastView.onRendered(function() {
	navigator.getMedia = getMedia();
	if (!navigator.getMedia) {
		return alert('getUserMedia() is not supported in your browser!');
	}
	navigator.getMedia(
		{video: true, audio: true}, localMediaStream =>	this.mediaStream.set(localMediaStream),
		(e) => console.log(e)
	);
});

Template.broadcastView.events({
	'click .start-streaming'(e, i) {
		const connection = i.connection.get();
		if (!connection) {
			return;
		}
		let options = {mimeType: 'video/webm;codecs=vp9'};
		if (!MediaRecorder.isTypeSupported(options.mimeType)) {
			options = {mimeType: 'video/webm;codecs=vp8'};
			if (!MediaRecorder.isTypeSupported(options.mimeType)) {
				options = {mimeType: 'video/webm'};
				if (!MediaRecorder.isTypeSupported(options.mimeType)) {
					options = {mimeType: ''};
				}
			}
		}
		try {
			const mediaRecorder = new MediaRecorder(i.mediaStream.get(), options);
			mediaRecorder.ondataavailable = (event) => {
				if (!(event.data || event.data.size > 0)) {
					return;
				}
				sendMessageToWebSocket(event.data, connection);
			};
			mediaRecorder.start(100); // collect 100ms of data
			i.mediaRecorder.set(mediaRecorder);

			Meteor.call('livestreamStart', {broadcastId: Session.get('openedRoom')});
		} catch (e) {
			alert(`Exception while creating MediaRecorder: ${ e }. mimeType: ${ options.mimeType }`);
			return;
		}
	}
});
