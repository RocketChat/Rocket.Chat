import type { IFreeSwitchChannelEvent } from '@rocket.chat/core-typings';

import { parseChannelUsername, parseContactUsername } from './parseChannelUsername';

function normalizeUsername(value?: string): string | undefined {
	if (!value) {
		return undefined;
	}

	if (value.startsWith('sofia/internal')) {
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

export function parseEventExtensions(
	event: Omit<IFreeSwitchChannelEvent, '_id' | '_updatedAt'>,
): { caller?: string; callee?: string } | undefined {
	const legs = event.legs && Object.values(event.legs);
	const selfLeg = event.legs?.[event.channelUniqueId];

	// The username of every leg seems to always be that of the caller
	const anyUsername = legs
		?.map(({ username }) => username)
		.filter((username) => username)
		.pop();
	const allDestinationNumbers = legs?.map(({ destinationNumber }) => destinationNumber) || [];

	// It won't ever be an array, but just to be type-safe
	const dialedExtension = Array.isArray(event.variables?.dialed_extension)
		? event.variables.dialed_extension.shift()
		: event.variables?.dialed_extension;

	if (event.callDirection === 'outbound') {
		const originator = legs?.find((leg) => leg.type === 'originator');

		return {
			// Still need to validate this with external calls
			caller: getMostLikelyUsername([originator?.channelName, originator?.username, anyUsername]),
			callee: getMostLikelyUsername([dialedExtension, event.channelUsername, originator?.destinationNumber, ...allDestinationNumbers]),
		};
	}

	if (event.callDirection === 'inbound') {
		return {
			caller: getMostLikelyUsername([event.channelUsername, selfLeg?.username, anyUsername]),
			// Callee might not be available at all if the state is still CS_NEW
			callee: getMostLikelyUsername([dialedExtension, selfLeg?.destinationNumber, ...allDestinationNumbers]),
		};
	}

	return {
		caller: getMostLikelyUsername([anyUsername]),
		callee: getMostLikelyUsername([dialedExtension, ...allDestinationNumbers]),
	};
}
