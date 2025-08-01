import type { EventData } from './parseEventData';

function shouldUseOtherLegId(eventData: EventData): boolean {
	// If the call ID is from a different channel, then it should be correct
	if (eventData['Channel-Call-UUID'] !== eventData['Unique-ID']) {
		return false;
	}

	// If we don't have an originator ID, then we don't have anything to overwrite with
	if (eventData['Other-Type'] !== 'originator' || !eventData['Other-Leg-Unique-ID']) {
		return false;
	}

	// #ToDo: Confirm if these conditions hold up on calls with extra legs (eg. voicemail)
	if (
		eventData['Caller-Direction'] !== 'outbound' ||
		(eventData['Other-Leg-Direction'] === 'outbound' && eventData['Other-Leg-Logical-Direction'])
	) {
		return false;
	}

	return true;
}

/**
 * Gets the call id from the event data.
 * For most cases the call id will be the value that freeswitch sends on 'Channel-Call-UUID',
 * but on the callee leg of a call that variable will only have the correct value on events triggered while the call is ongoing
 * so for the callee leg we sometimes pick it from a different attribute.
 *
 * This function doesn't validate if an id was actually received, so it might return undefined, but FreeSwitch SHOULD always be sending one.
 */
export function parseEventCallId(eventData: EventData): string | undefined {
	if (shouldUseOtherLegId(eventData)) {
		return eventData['Other-Leg-Unique-ID'];
	}

	return eventData['Channel-Call-UUID'];
}
