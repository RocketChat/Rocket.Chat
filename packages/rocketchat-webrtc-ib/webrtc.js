
webrtc = {
	// cid: Random.id(),
	stackid: 'webrtc-ib',
	pc: undefined,
	to: undefined,
	room: undefined,
	activeMediastream: undefined,
	remoteDataSDP: undefined,
	mode: undefined,
	lastSeenTimestamp: new Date(),
	debug: false,
	config: {
		iceServers: [
			{url: "stun:23.21.150.121"},
			{url: "stun:stun.l.google.com:19302"}
		]
	},
	send: function(data) {
		console.log
		data.to = webrtc.to;
		data.from = Meteor.user().username;
		Meteor.call('sendMessage', {
			t: 'rtc',
			u: {username: data.from},
			to: webrtc.to,
			msg: JSON.stringify(data),
			rid: webrtc.room,
			mode: (webrtc.mode ? webrtc.mode : 0)
		});

	},
	stop: function(sendEvent) {
		if (webrtc.activeMediastream) {
			webrtc.activeMediastream = undefined;
		}

		if (webrtc.pc) {
			if (webrtc.pc.signalingState != 'closed') {
				webrtc.pc.close();
			webrtc.pc = undefined;
			webrtc.mode = 0;
			}
		}


		this.onRemoteUrl();
		this.onSelfUrl();
		if (sendEvent != false) {
			webrtc.send( {to: webrtc.to, close: true});
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

webrtc.activateLocalStream = function() {
		var media ={ "audio": true, "video": {mandatory: {minWidth:1280, minHeight:720}}} ;

		// get the local stream, show it in the local video element and send it
		navigator.getUserMedia(media, function (stream) {
			webrtc.log('getUserMedia got stream');
			webrtc.onSelfUrl(URL.createObjectURL(stream));
			webrtc.activeMediastream = stream;

		}, function(e) { webrtc.log('getUserMedia failed during activateLocalStream ' + e); });
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
		webrtc.log('onaddstream', arguments);
		webrtc.onRemoteUrl(URL.createObjectURL(evt.stream));
	};

	webrtc.pc.oniceconnectionstatechange = function(evt) {
		webrtc.log('oniceconnectionstatechange', arguments)
		var srcElement = evt.srcElement || evt.target;
		if (srcElement.iceConnectionState == 'disconnected' || srcElement.iceConnectionState == 'closed') {
			if (webrtc.pc)  {
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
				webrtc.mode = 0;
			}

		}
	}


	var gotDescription = function(desc) {
			webrtc.pc.setLocalDescription(desc, function() {}, onError);
			webrtc.send({ "sdp": desc.toJSON(), cid: webrtc.cid });

	}

	var CreateMonitoringOffer = function() {

		webrtc.pc.createOffer(gotDescription, onError,  { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } });

	}

	var AutoConnectStream = function() {
		webrtc.pc.addStream(webrtc.activeMediastream);
		webrtc.pc.setRemoteDescription(new RTCSessionDescription(webrtc.remoteDataSDP));
		webrtc.pc.createAnswer(gotDescription, onError);

	}
	var LocalGetUserMedia = function() {



		var media ={ "audio": true, "video": {mandatory: {minWidth:1280, minHeight:720}}} ;


		// get the local stream, show it in the local video element and send it
		navigator.getUserMedia(media, function (stream) {
			webrtc.log('getUserMedia got stream');
			webrtc.onSelfUrl(URL.createObjectURL(stream));

			webrtc.pc.addStream(stream);

			if (isCaller) {
				webrtc.pc.createOffer(gotDescription, onError);
			} else {
				webrtc.pc.createAnswer(gotDescription, onError);
			}

		}, function(e) { webrtc.log('getUserMedia failed' + e); });

	}

	if (isCaller) {
		webrtc.log('isCaller LocalGetUserMedia');
		if (webrtc.mode) {
			if (webrtc.mode === 2) {
				CreateMonitoringOffer();
			} else { // node === 1

				LocalGetUserMedia();
			}
		} else {
			// no mode
			LocalGetUserMedia();
		}

	} else {
		if (!webrtc.activeMediastream) {
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
					LocalGetUserMedia();
				} else {
					webrtc.stop();
				}
			});
		}  else {
			AutoConnectStream();
		}
	}
}


webrtc.processIncomingRtcMessage = function(data, from, room) {
	webrtc.log('processIncomingRtcMessage()', Meteor.userId(), data)
	if (!webrtc.to) {
		webrtc.to = from;
	}

	if (!webrtc.room) {
		webrtc.room = room;
	}


	// do not stop local video if in monitoring mode
	if  (data.close == true) {

	  if (webrtc.activeMediastream) {
	  	if (webrtc.pc) {
			webrtc.pc.getRemoteStreams().forEach(function(stream) {
					if (!stream.stop) {
						stream.stop();
					}
				});
			webrtc.pc = undefined;
			webrtc.mode = 0;
		}

	  } else {

		webrtc.stop(false);

	 }
	 return
	}


	if (!webrtc.pc) {
		if ((webrtc.activeMediastream) && (data.sdp != undefined)){
			webrtc.remoteDataSDP = data.sdp;
		}
		webrtc.start(false, data.from);
	}

	if (data.sdp != undefined) {
		webrtc.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
	} else {
		if( ["closed", "failed", "disconnected", "completed"].indexOf(webrtc.pc.iceConnectionState) === -1) {
			webrtc.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
		}
	}

}


