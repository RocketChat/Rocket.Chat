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
export const call = (...args) => new Promise(function(resolve, reject) {
	Meteor.call(...args, function(err, result) {
		if (err) {
			handleError(err);
			reject(err);
		}
		resolve(result);
	});
});

const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

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
	async 'startStreaming .streaming-popup'(e, i) {
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

			while (true) { //eslint-disable-line no-constant-condition
				const result = await call('livestreamStreamStatus', {streamId:i.data.stream.id});
				if (result === 'active') {
					break;
				}
				await delay(1000);
			}

			await call('livestreamTest', {broadcastId:i.data.broadcast.id});
			call('saveRoomSettings', Session.get('openedRoom'), 'streamingOptions', {id: i.data.broadcast.id, url: `https://www.youtube.com/embed/${ i.data.broadcast.id }`, thumbnail: `https://img.youtube.com/vi/${ i.data.broadcast.id }/0.jpg`}, function(err) {
				if (err) {
					return handleError(err);
				}
			});

			await delay(25000);
			await call('livestreamStart', {broadcastId:i.data.broadcast.id});
			document.querySelector('.streaming-popup').dispatchEvent(new Event('broadcastStream'));

		} catch (e) {
			alert(`Exception while creating MediaRecorder: ${ e }. mimeType: ${ options.mimeType }`);
			return;
		}
	}
});
