import type { AtLeast, IFreeSwitchChannelEvent, IFreeSwitchChannelEventLeg } from '@rocket.chat/core-typings';

import { parseChannelUsername, parseContactUsername } from './parseChannelUsername';

function normalizeUsername(value?: string): string | undefined {
	if (!value) {
		return undefined;
	}

	if (value.startsWith('sofia/internal') || value.startsWith('sofia/external')) {
		return parseChannelUsername(value);
	}

	if (value.match(/^\d+$/)) {
		return value;
	}

	return parseContactUsername(value);
}

function getMostLikelyUsername(valueList: (string | undefined)[]): string | undefined {
	const parsedValues: string[] = [];

	for (const value of valueList) {
		const parsedValue = normalizeUsername(value);
		if (!parsedValue) {
			continue;
		}

		if (parsedValue === value) {
			return parsedValue;
		}

		parsedValues.push(parsedValue);
	}

	return parsedValues.shift();
}

function getOriginatorLeg(
	event: Omit<IFreeSwitchChannelEvent, '_id' | '_updatedAt'>,
): AtLeast<IFreeSwitchChannelEventLeg, 'legName' | 'uniqueId' | 'raw'> | undefined {
	const legs = event.legs && Object.values(event.legs);
	if (!legs?.length) {
		return undefined;
	}

	const selfLeg = event.legs[event.channelUniqueId];
	const originator = legs.find((leg) => leg.type === 'originator');

	if (event.callDirection === 'inbound') {
		return originator || selfLeg;
	}

	if (originator) {
		return originator;
	}

	const originatee = legs.find((leg) => leg.type === 'originatee');
	if (originatee && selfLeg && selfLeg.type !== 'originatee') {
		return selfLeg;
	}

	return undefined;
}

export function parseEventExtensions(
	event: Omit<IFreeSwitchChannelEvent, '_id' | '_updatedAt'>,
): { caller?: string; callee?: string } | undefined {
	const legs = event.legs && Object.values(event.legs);
	const selfLeg = event.legs?.[event.channelUniqueId];

	const allDestinationNumbers = legs?.map(({ destinationNumber }) => destinationNumber) || [];
	const allCallerNumbers = legs?.map(({ callerNumber }) => callerNumber) || [];

	// The dialed_extension variable is only available in a few specific events, but when it's there, it's ALWAYS right.
	// It won't ever be an array, but just to be type-safe
	const dialedExtension = Array.isArray(event.variables?.dialed_extension)
		? event.variables.dialed_extension.shift()
		: event.variables?.dialed_extension;

	const originator = getOriginatorLeg(event);
	if (event.callDirection === 'outbound' && originator) {
		// If we have an originator, use it as the source of truth
		return {
			caller: getMostLikelyUsername([originator.channelName]),
			callee: getMostLikelyUsername([dialedExtension, originator.destinationNumber]),
		};
	}

	// If the channel is inbound, then it has never received any call, only initiated.
	if (event.callDirection === 'inbound') {
		// The username of every leg is always the original caller
		const anyUsername = legs
			?.map(({ username }) => username)
			.filter((username) => username)
			.pop();

		return {
			caller: getMostLikelyUsername([event.channelUsername, selfLeg?.username, anyUsername]),
			// Callee might not be available at all if the state is still CS_NEW
			callee: getMostLikelyUsername([dialedExtension, selfLeg?.destinationNumber, ...allDestinationNumbers]),
		};
	}

	// Caller-Number and Destination-Number always have some sort of identification of the right caller/destination
	// For rocket.chat internal calls, we'll always be able to parse it into an extension number
	// For external calls, this might not be identifying the extension at all.
	return {
		caller: getMostLikelyUsername([...allCallerNumbers]),
		callee: getMostLikelyUsername([dialedExtension, ...allDestinationNumbers]),
	};
}
