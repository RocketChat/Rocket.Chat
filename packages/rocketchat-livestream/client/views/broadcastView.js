const hasGetUserMedia = () => !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
const createAndConnect = (url) => {
	if ('WebSocket' in window) {
		const ws = new WebSocket(url);
		ws.onopen = () => console.log('connected');

		ws.onclose = () => console.log('closed');

		ws.onerror = (evt) => console.error(`Error: ${ evt.data }`);

		return ws;
	} else {
		return null;
	}
};
const sendMessageToWebSocket = (message, ws) => {
	if (ws != null) {
		if (ws.readyState === 1) { ws.send(message); }
	}
};

Template.broadcastView.helpers({
	broadcastSource() {
		return Template.instance().mediaStream.get() ? window.URL.createObjectURL(Template.instance().mediaStream.get()) : '';
	}
});

Template.broadcastView.onCreated(function() {
	this.connection = new ReactiveVar(createAndConnect(`ws://localhost:3001/${ this.data.id }`));
	this.mediaStream = new ReactiveVar(null);
	this.mediaRecorder = new ReactiveVar(null);
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

	navigator.getMedia = (navigator.getUserMedia ||
												navigator.webkitGetUserMedia ||
												navigator.mozGetUserMedia ||
												navigator.msGetUserMedia);

	if (hasGetUserMedia()) {
		navigator.getMedia(
			{video: true, audio: true},
			(localMediaStream) => {
				this.mediaStream.set(localMediaStream);
			},
			(e) => console.log(e)
		);
	} else {
		alert('getUserMedia() is not supported in your browser!');
	}
});

Template.broadcastView.events({
	'click .start-streaming'(e, i) {
		let options = {mimeType: 'video/webm;codecs=vp9'};
		if (!MediaRecorder.isTypeSupported(options.mimeType)) {
			console.log(`${ options.mimeType } is not Supported`);
			options = {mimeType: 'video/webm;codecs=vp8'};
			if (!MediaRecorder.isTypeSupported(options.mimeType)) {
				console.log(`${ options.mimeType } is not Supported`);
				options = {mimeType: 'video/webm'};
				if (!MediaRecorder.isTypeSupported(options.mimeType)) {
					console.log(`${ options.mimeType } is not Supported`);
					options = {mimeType: ''};
				}
			}
		}
		try {
			i.mediaRecorder.set(new MediaRecorder(i.mediaStream.get(), options));
		} catch (e) {
			console.error(`Exception while creating MediaRecorder: ${ e }`);
			alert(`Exception while creating MediaRecorder: ${ e }. mimeType: ${ options.mimeType }`);
			return;
		}
		i.mediaRecorder.get().ondataavailable = (event) => {
			if (event.data && event.data.size > 0) {
				sendMessageToWebSocket(event.data, i.connection.get());
			}
		};
		i.mediaRecorder.get().start(10); // collect 10ms of data
	}
});
