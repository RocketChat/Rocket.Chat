class IncomingRtcMessageProcessor
	constructor: (message) ->
		if (message.to == Meteor.userId())
			if (message.ts > webrtc.lastSeenTimestamp)
				webrtc.lastSeenTimestamp = message.ts
				# console.log('RTC ' + JSON.stringify(message))
				webrtc.processIncomingRtcMessage(JSON.parse(message.msg), message.rid.replace(message.to, ''), message.rid)



# stream.on(Meteor.userId(), function(data) {
#	webrtc.log('stream.on', Meteor.userId(), data)
#	if (data.close == true) {
#		webrtc.stop(false);
#	}

#	if (!webrtc.pc)
#		webrtc.start(false, data.from);
#
#	if (data.sdp) {
#		webrtc.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
#	} else {
#		if( ["closed", "failed", "disconnected", "completed"].indexOf(webrtc.pc.iceConnectionState) === -1) {
#			webrtc.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
#		}
#	}
#});



RocketChat.callbacks.add 'renderRtcMessage', IncomingRtcMessageProcessor, RocketChat.callbacks.priority.LOW
