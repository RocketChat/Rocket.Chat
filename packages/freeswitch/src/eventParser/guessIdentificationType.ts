// Returns a set of values that are known to be extensions - of any of the users in the call
function getKnownExtensions(eventData: Record<string, string | undefined>): Set<string> {
	const extensions = new Set<string>();

	// Usernames are always extensions
	if (eventData['Caller-Username']) {
		extensions.add(eventData['Caller-Username']);
	}
	if (eventData['Other-Leg-Username']) {
		extensions.add(eventData['Other-Leg-Username']);
	}

	const callId = eventData['Channel-Call-UUID'];
	const isInitiatorChannel = eventData['Caller-Direction'] === 'inbound';
	const isCallerChannel = eventData['Unique-ID'] === callId;

	// If the call was initiated by the caller (for example: is not a transfer)
	if (isInitiatorChannel && isCallerChannel) {
		// Calls that were initiated by the caller will always have the caller's extension on Caller-ID-Number of the caller's channel
		if (eventData['Caller-Caller-ID-Number']) {
			extensions.add(eventData['Caller-Caller-ID-Number']);
		}
	}

	const isOtherLegInitiatorChannel = eventData['Other-Leg-Direction'] === 'inbound';
	const isOtherLegCallerChannel = eventData['Other-Leg-Unique-ID'] === callId;

	// Same test as above but using data from a linked channel instead of this event's own channel
	if (isOtherLegInitiatorChannel && isOtherLegCallerChannel && eventData['Other-Leg-Caller-ID-Number']) {
		extensions.add(eventData['Other-Leg-Caller-ID-Number']);
	}

	if (eventData.variable_dialed_user) {
		extensions.add(eventData.variable_dialed_user);
	}
	if (eventData.variable_dialed_extension) {
		extensions.add(eventData.variable_dialed_extension);
	}

	if (isInitiatorChannel) {
		if (eventData['Caller-Destination-Number']) {
			extensions.add(eventData['Caller-Destination-Number']);
		}
	} else if (eventData['Other-Type'] === 'originator' && eventData['Other-Leg-Destination-Number']) {
		extensions.add(eventData['Other-Leg-Destination-Number']);
	}

	return extensions;
}

// Returns a set of values that are known to be a contact - of any of the users in the call
function getKnownContacts(eventData: Record<string, string | undefined>): Set<string> {
	const contacts = new Set<string>();

	if (eventData['Caller-Callee-ID-Number']) {
		// Caleee tends to always be a contact, except on illogical events

		if (eventData['Caller-Direction'] === 'inbound' || eventData['Other-Type'] === 'originator') {
			contacts.add(eventData['Caller-Callee-ID-Number']);
		}
	}

	if (eventData.variable_sip_contact_user) {
		contacts.add(eventData.variable_sip_contact_user);
	}

	if (eventData['Other-Leg-Destination-Number'] && eventData['Other-Type'] === 'originatee') {
		contacts.add(eventData['Other-Leg-Destination-Number']);
	}

	return contacts;
}

// Returns a set with every channel name found in the event's data
function getKnownChannelNames(eventData: Record<string, string | undefined>): Set<string> {
	const channels = new Set<string>();

	if (eventData['Caller-Channel-Name']) {
		channels.add(eventData['Caller-Channel-Name']);
	}

	if (eventData.variable_channel_name) {
		channels.add(eventData.variable_channel_name);
	}

	return channels;
}

function getKnownPresenceIds(eventData: Record<string, string | undefined>): Set<string> {
	const presenceIds = new Set<string>();

	if (eventData['Channel-Presence-ID']) {
		presenceIds.add(eventData['Channel-Presence-ID']);
	}

	if (eventData.variable_presence_id) {
		presenceIds.add(eventData.variable_presence_id);
	}

	return presenceIds;
}

export function guessIdentificationType(
	value: string,
	eventData: Record<string, string | undefined>,
): 'extension' | 'contact' | 'voicemail' | undefined {
	if (!value) {
		return;
	}

	if (value === 'voicemail') {
		return 'voicemail';
	}

	// Neither extension nor contact can have spaces
	// Only case where I saw spaces in an identifier was on direct calls to a voicemail
	if (value.includes(' ')) {
		return;
	}

	// The operations here are ordered based on how confident we are at the assumptions they make

	// 1. If the value is used in a Presence-ID string, it can't be a contact
	// 2. If the value is used in a channel name:
	// 2.1. If that channel name is using a randomly generated host name, then the value is a contact
	// 2.2. If there is no random host name, then the value is an extension
	// 3. We have a list of values that we know are extensions (just don't know which user's extension that is) - If the value is in that list, then it is an extension
	// 4. Same as 3, but with a list of values we know are contacts.

	const presenceIds = getKnownPresenceIds(eventData);
	for (const presenceId of presenceIds) {
		// Presence-ID always use the extension, never the contact
		// So if a presence ID uses this value, the value is an extension.
		if (presenceId.startsWith(`${value}@`)) {
			return 'extension';
		}
	}

	const channelNames = getKnownChannelNames(eventData);

	// Real User's channels' name use the `sofia/internal/${identifier}@${host}` format
	for (const channelName of channelNames) {
		if (channelName?.includes(`/${value}@`)) {
			// The identifier can be either an extension or a contact, but when it is a contact it'll use a random string for host, with `.invalid` appended to it
			if (channelName.includes('.invalid')) {
				return 'contact';
			}

			return 'extension';
		}
	}

	// If the value is on the list of known extensions, then it is an extension
	const knownExtensions = getKnownExtensions(eventData);
	if (knownExtensions.has(value)) {
		return 'extension';
	}

	// If the value is on the list of known contacts, then it is a contact
	const knownContacts = getKnownContacts(eventData);
	if (knownContacts.has(value)) {
		return 'contact';
	}
}
