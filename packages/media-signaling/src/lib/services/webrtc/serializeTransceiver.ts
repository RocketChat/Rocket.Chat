export function serializeTransceiver(transceiver: RTCRtpTransceiver): Record<string, any> {
	const stopped = 'stopped' in transceiver && transceiver.stopped;

	return {
		stopped,
		mid: transceiver.mid,
		sender: transceiver.sender ? serializeSender(transceiver.sender) : null,
		receiver: transceiver.receiver ? serializeReceiver(transceiver.receiver) : null,
		direction: transceiver.direction,
		currentDirection: transceiver.currentDirection,
	};
}

function serializeSender(sender: RTCRtpSender): Record<string, any> {
	return {
		track: sender.track ? serializeTrack(sender.track) : null,
		transport: Boolean(sender.transport),
	};
}

function serializeReceiver(receiver: RTCRtpReceiver): Record<string, any> {
	return {
		track: receiver.track ? serializeTrack(receiver.track) : null,
		transport: Boolean(receiver.transport),
	};
}

function serializeTrack(track: MediaStreamTrack): Record<string, any> {
	return {
		kind: track.kind,
		id: track.id,
		enabled: track.enabled,
		label: track.label,
		muted: track.muted,
		readyState: track.readyState,
	};
}
