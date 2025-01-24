export function shouldIgnoreEventUsers(eventData: Record<string, string>): boolean {
	const eventName = eventData['Event-Name'];

	// The data on OUTGOING events is unreliable as it mixes the original with the forwarded call
	if (['CHANNEL_DESTROY', 'CHANNEL_OUTGOING'].includes(eventName)) {
		return true;
	}
	if (eventName === 'CHANNEL_STATE' && eventData['Channel-State'] === 'CS_DESTROY') {
		return true;
	}

	return false;
}
