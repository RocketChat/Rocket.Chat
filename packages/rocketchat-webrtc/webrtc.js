webrtc = {
	// cid: Random.id(),
	pc: undefined,
	to: undefined,
	stream: stream,
	send: function(data) {
		data.to = webrtc.to;
		stream.emit('send', data);
	},
	onRemoteUrl: function() {},
	onSelfUrl: function() {}
}

// run start(true) to initiate a call
webrtc.start = function (isCaller) {
	webrtc.pc = new RTCPeerConnection();

	// send any ice candidates to the other peer
	webrtc.pc.onicecandidate = function (evt) {
		if (evt.candidate) {
			webrtc.send({ "candidate": evt.candidate.toJSON(), cid: webrtc.cid });
		}
	};

	// once remote stream arrives, show it in the remote video element
	webrtc.pc.onaddstream = function (evt) {
		webrtc.onRemoteUrl(URL.createObjectURL(evt.stream));
	};

	// get the local stream, show it in the local video element and send it
	navigator.getUserMedia({ "audio": true, "video": true }, function (stream) {
		webrtc.onSelfUrl(URL.createObjectURL(stream));

		webrtc.pc.addStream(stream);

		if (isCaller) {
			webrtc.pc.createOffer(gotDescription);
		} else {
			webrtc.pc.createAnswer(gotDescription);
		}

		function gotDescription(desc) {
			webrtc.pc.setLocalDescription(desc);
			webrtc.send({ "sdp": desc.toJSON(), cid: webrtc.cid });
		}
	}, function() {});
}

stream.on(Meteor.userId(), function(data) {
	if (!webrtc.pc)
		webrtc.start(false);

	if (data.sdp) {
		webrtc.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
	} else {
		webrtc.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
	}
});