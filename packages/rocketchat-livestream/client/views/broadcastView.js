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
	const connection = createAndConnect(`ws://localhost:3002/${ this.data.id }`);
	this.mediaStream = new ReactiveVar(null);
	this.mediaRecorder = new ReactiveVar(null);
	this.connection = new ReactiveVar(connection);

	if (!connection) {
		return;
	}
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
Template.broadcastView.onRendered(async function() {
	navigator.getMedia = getMedia();
	if (!navigator.getMedia) {
		return alert('getUserMedia() is not supported in your browser!');
	}
	const localMediaStream = await new Promise((resolve, reject) => navigator.getMedia({video: true, audio: true}, resolve, reject));

	const connection = this.connection.get();

	this.mediaStream.set(localMediaStream);
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
		const mediaRecorder = new MediaRecorder(localMediaStream, options);
		mediaRecorder.ondataavailable = (event) => {
			if (!(event.data || event.data.size > 0)) {
				return;
			}
			sendMessageToWebSocket(event.data, connection);
		};
		mediaRecorder.start(300); // collect 100ms of data
		this.mediaRecorder.set(mediaRecorder);

		while (true) { //eslint-disable-line no-constant-condition
			const result = await call('livestreamStreamStatus', {streamId:this.data.stream.id});
			if (result === 'active') {
				break;
			}
			console.log(result, 'FOR->>>>>');
			await delay(1000);
		}
		console.log('active');
		await call('livestreamTest', {broadcastId:this.data.broadcast.id});
		document.querySelector('.streaming-popup').dispatchEvent(new Event('broadcastStreamReady'));
	} catch (e) {
		console.log(e);
	}
});

Template.broadcastView.events({
	async 'startStreaming .streaming-popup'(e, i) {


		await call('livestreamStart', {broadcastId: i.data.broadcast.id});
		await call('saveRoomSettings', Session.get('openedRoom'), 'streamingOptions', {id: i.data.broadcast.id, url: `https://www.youtube.com/embed/${ i.data.broadcast.id }`, thumbnail: `https://img.youtube.com/vi/${ i.data.broadcast.id }/0.jpg`});
		document.querySelector('.streaming-popup').dispatchEvent(new Event('broadcastStream'));
	}
});
