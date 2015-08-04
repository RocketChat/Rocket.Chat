webrtc = {
	// cid: Random.id(),
	pc: undefined,
	to: undefined,
	room: undefined,
	debug: false,
	config: {
		iceServers: [
			{url: "stun:23.21.150.121"},
			{url: "stun:stun.l.google.com:19302"}
		]
	},
	stream: stream,
	send: function(data) {
		data.to = webrtc.to;
		data.room = webrtc.room;
		data.from = Meteor.user().username;
		stream.emit('send', data);
	},
	stop: function(sendEvent) {
		if (webrtc.pc) {
			if (webrtc.pc.signalingState != 'closed') {
				webrtc.pc.close();
			}
			if (sendEvent != false) {
				stream.emit('send', {to: webrtc.to, room: webrtc.room, from: Meteor.userId(), close: true});
			}
		}
	},
	log: function() {
		if (webrtc.debug === true) {
			console.log.apply(console, arguments);
		}
	},
	onRemoteUrl: function() {},
	onSelfUrl: function() {}
}

function onError() {
	console.log(arguments);
}

// run start(true) to initiate a call
webrtc.start = function (isCaller, fromUsername) {
	webrtc.pc = new RTCPeerConnection(webrtc.config);

	webrtc.pc.ondatachannel = function() {webrtc.log('ondatachannel', arguments)}
	webrtc.pc.onidentityresult = function() {webrtc.log('onidentityresult', arguments)}
	webrtc.pc.onidpassertionerror = function() {webrtc.log('onidpassertionerror', arguments)}
	webrtc.pc.onidpvalidationerror = function() {webrtc.log('onidpvalidationerror', arguments)}
	webrtc.pc.onnegotiationneeded = function() {webrtc.log('onnegotiationneeded', arguments)}
	webrtc.pc.onpeeridentity = function() {webrtc.log('onpeeridentity', arguments)}
	webrtc.pc.onremovestream = function() {webrtc.log('onremovestream', arguments)}
	webrtc.pc.onsignalingstatechange = function() {webrtc.log('onsignalingstatechange', arguments)}

	// send any ice candidates to the other peer
	webrtc.pc.onicecandidate = function (evt) {
		webrtc.log('onicecandidate', arguments)
		if (evt.candidate) {
			webrtc.send({ "candidate": evt.candidate.toJSON(), cid: webrtc.cid });
		}
	};

	// once remote stream arrives, show it in the remote video element
	webrtc.pc.onaddstream = function (evt) {
		webrtc.log('onaddstream', arguments)
		webrtc.onRemoteUrl(URL.createObjectURL(evt.stream));
	};

	webrtc.pc.oniceconnectionstatechange = function(evt) {
		webrtc.log('oniceconnectionstatechange', arguments)
		var srcElement = evt.srcElement || evt.target;
		if (srcElement.iceConnectionState == 'disconnected' || srcElement.iceConnectionState == 'closed') {
			webrtc.pc.getLocalStreams().forEach(function(stream) {
				stream.stop();
				webrtc.onSelfUrl();
			});
			webrtc.pc.getRemoteStreams().forEach(function(stream) {
				if (stream.stop) {
					stream.stop();
				}
				webrtc.onRemoteUrl();
			});
			webrtc.pc = undefined;
		}
	}

	var getUserMedia = function() {
		// get the local stream, show it in the local video element and send it
		navigator.getUserMedia({ "audio": true, "video": {mandatory: {minWidth:1280, minHeight:720}} }, function (stream) {
			webrtc.onSelfUrl(URL.createObjectURL(stream));

			webrtc.pc.addStream(stream);

			if (isCaller) {
				webrtc.pc.createOffer(gotDescription, onError);
			} else {
				webrtc.pc.createAnswer(gotDescription, onError);
			}

			function gotDescription(desc) {
				webrtc.pc.setLocalDescription(desc, function() {}, onError);
				webrtc.send({ "sdp": desc.toJSON(), cid: webrtc.cid });
			}
		}, function() {});
	}

	if (isCaller) {
		getUserMedia();
	} else {
		swal({
			title: "Video call from "+fromUsername,
			text: "Do you want to accept?",
			type: "warning",
			showCancelButton: true,
			confirmButtonColor: "#DD6B55",
			confirmButtonText: "Yes",
			cancelButtonText: "No"
		}, function(isConfirm){
			if (isConfirm) {
				getUserMedia();
			} else {
				webrtc.stop();
			}
		});
	}
}

stream.on(Meteor.userId(), function(data) {
	webrtc.log('stream.on', Meteor.userId(), data)
	if (!webrtc.to) {
		webrtc.to = data.room.replace(Meteor.userId(), '');
	}

	if (!webrtc.room) {
		webrtc.room = data.room;
	}

	if (data.close == true) {
		webrtc.stop(false);
		return
	}

	if (!webrtc.pc)
		webrtc.start(false, data.from);

	if (data.sdp) {
		webrtc.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
	} else {
		if( ["closed", "failed", "disconnected", "completed"].indexOf(webrtc.pc.iceConnectionState) === -1) {
			webrtc.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
		}
	}
});
