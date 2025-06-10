import type { IFreeSwitchChannel, IFreeSwitchChannelEvent } from '@rocket.chat/core-typings';
import { convertPathsIntoSubObjects } from '@rocket.chat/tools';

import { computeChannelProfiles } from './computeChannelProfiles';
import { convertEventDataIntoPaths } from './convertEventDataIntoPaths';
import { extractChannelChangesFromEvent } from './extractChannelChangesFromEvent';
import { filterOutMissingData } from './filterOutMissingData';

export async function computeChannelFromEvents(
	allEvents: IFreeSwitchChannelEvent[],
): Promise<Omit<IFreeSwitchChannel, '_id' | '_updatedAt'> | undefined> {
	const differences: Record<string, Record<string, any>> = {};
	const uniqueId = allEvents[0].channelUniqueId;
	const callDirections: string[] = [];
	const callers: string[] = [];
	const callees: string[] = [];
	const bridgedTo: string[] = [];

	const flattened = allEvents.reduce(
		(state: Record<string, any>, nextEvent: IFreeSwitchChannelEvent): Record<string, any> => {
			const { _id, channelUniqueId, _updatedAt, metadata, eventName, sequence, firedAt, receivedAt, callee, caller, ...eventData } =
				nextEvent;
			if (nextEvent.callDirection && !callDirections.includes(nextEvent.callDirection)) {
				callDirections.push(nextEvent.callDirection);
			}
			if (callee && !callees.includes(callee)) {
				callees.push(callee);
			}
			if (caller && !callers.includes(caller)) {
				callers.push(caller);
			}

			if (eventData.bridgeUniqueIds) {
				for (const bridgeUniqueId of eventData.bridgeUniqueIds) {
					if (bridgeUniqueId && !bridgedTo.includes(bridgeUniqueId) && bridgeUniqueId !== uniqueId) {
						bridgedTo.push(bridgeUniqueId);
					}
				}
			}
			if (eventData.bridgedTo && !bridgedTo.includes(eventData.bridgedTo)) {
				bridgedTo.push(eventData.bridgedTo);
			}

			const eventValues = convertEventDataIntoPaths(channelUniqueId, eventData, { callee, caller, bridgedTo: eventData.bridgedTo });

			const { changedValues, newValues, changedExistingValues } = extractChannelChangesFromEvent(state, eventName, eventValues);
			differences[sequence] = filterOutMissingData({
				eventName,
				sequence,
				firedAt,
				receivedAt,
				caller,
				callee,

				newValues: convertPathsIntoSubObjects(newValues),
				changedValues: convertPathsIntoSubObjects(changedExistingValues),
			});

			return {
				channelUniqueId,
				...state,
				eventName,
				sequence,
				...changedValues,
			};
		},
		{} as Record<string, any>,
	);

	const finalState = convertPathsIntoSubObjects(flattened) as IFreeSwitchChannel['finalState'];

	return {
		uniqueId,
		name: finalState.channelName,
		callDirection: callDirections.join('||'),
		freeSwitchUser: finalState.channelUsername,
		callers,
		callees,
		events: differences,
		finalState,
		bridgedTo,
		profiles: computeChannelProfiles(finalState.legs?.[uniqueId]?.profiles || {}),
	};
}
