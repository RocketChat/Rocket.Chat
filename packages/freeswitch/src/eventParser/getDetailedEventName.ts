export function getDetailedEventName(eventName: string, eventData: Record<string, string>): string {
	if (eventName === 'CHANNEL_STATE') {
		return `CHANNEL_STATE=${eventData['Channel-State']}`;
	}

	if (eventName === 'CHANNEL_CALLSTATE') {
		return `CHANNEL_CALLSTATE=${eventData['Channel-Call-State']}`;
	}

	return eventName;
}
