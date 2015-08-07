class IncomingRtcMessageProcessor
	constructor: (message) ->
		if (message.to == Meteor.userId())
			if (message.ts > webrtc.lastSeenTimestamp)
				webrtc.lastSeenTimestamp = message.ts
				webrtc.processIncomingRtcMessage(JSON.parse(message.msg), message.rid.replace(message.to, ''), message.rid)

RocketChat.callbacks.add 'renderRtcMessage', IncomingRtcMessageProcessor, RocketChat.callbacks.priority.LOW
