import type {
	IFreeSwitchChannel,
	IFreeSwitchChannelEvent,
	IFreeSwitchChannelEventDeltaData,
	IFreeSwitchChannelEventHeader,
	IFreeSwitchChannelEventMutable,
} from '@rocket.chat/core-typings';
import { convertPathsIntoSubObjects, convertSubObjectsIntoPaths } from '@rocket.chat/tools';

import { computeChannelProfiles } from './computeChannelProfiles';
import { extractChannelChangesFromEvent } from './extractChannelChangesFromEvent';
import { filterOutMissingData } from './filterOutMissingData';
import { insertDataIntoEventProfile } from './insertDataIntoEventProfile';
import { parseChannelKind } from './parseChannelKind';

function splitEventDataSections(event: IFreeSwitchChannelEvent): {
	header: IFreeSwitchChannelEventHeader;
	eventData: IFreeSwitchChannelEventMutable;
	channelUniqueId: string;
} {
	const { _id, channelUniqueId, _updatedAt, metadata, eventName, sequence, firedAt, receivedAt, callee, caller, ...eventData } = event;

	return {
		channelUniqueId,
		header: {
			sequence,
			eventName,
			firedAt,
			receivedAt,
			callee,
			caller,
		},
		eventData,
	};
}

export async function computeChannelFromEvents(allEvents: IFreeSwitchChannelEvent[]): Promise<
	| {
			channel: Omit<IFreeSwitchChannel, '_id' | '_updatedAt'>;
			deltas: IFreeSwitchChannelEventDeltaData[];
			finalState: IFreeSwitchChannelEventMutable;
	  }
	| undefined
> {
	if (!allEvents.length) {
		return;
	}

	const deltas: IFreeSwitchChannelEventDeltaData[] = [];
	const { channelUniqueId: uniqueId, firedAt: firstEvent } = allEvents[0];
	const callDirections: string[] = [];
	const callers: string[] = [];
	const callees: string[] = [];
	const bridgedTo: string[] = [];

	for (const event of allEvents) {
		const { callee, caller, bridgeUniqueIds, bridgedTo: eventBridgedTo } = event;

		if (event.callDirection && !callDirections.includes(event.callDirection)) {
			callDirections.push(event.callDirection);
		}
		if (callee && !callees.includes(callee)) {
			callees.push(callee);
		}
		if (caller && !callers.includes(caller)) {
			callers.push(caller);
		}

		if (bridgeUniqueIds) {
			for (const bridgeUniqueId of bridgeUniqueIds) {
				if (bridgeUniqueId && !bridgedTo.includes(bridgeUniqueId) && bridgeUniqueId !== uniqueId) {
					bridgedTo.push(bridgeUniqueId);
				}
			}
		}
		if (eventBridgedTo && !bridgedTo.includes(eventBridgedTo)) {
			bridgedTo.push(eventBridgedTo);
		}
	}

	const flattened = allEvents.reduce(
		(state, nextEvent: IFreeSwitchChannelEvent) => {
			const { header, eventData, channelUniqueId } = splitEventDataSections(nextEvent);
			const { caller, callee, eventName, sequence } = header;

			// Inserts the callee and bridgedTo attributes into the profile of this event
			const eventDataEx = insertDataIntoEventProfile(eventData, { caller, callee, bridgedTo: eventData.bridgedTo });

			// Make a list with every value from the event, except for the headers;
			const eventValues = convertSubObjectsIntoPaths(eventDataEx);

			// Compare the event's list of values with the full list from all past events
			const { changedValues, newValues, changedExistingValues } = extractChannelChangesFromEvent(state, eventName, eventValues);

			// Generate a "delta" entry with the data that has changed in this event
			const delta: IFreeSwitchChannelEventDeltaData = {
				...header,

				newValues: convertPathsIntoSubObjects(newValues),
				modifiedValues: convertPathsIntoSubObjects(changedExistingValues),
			};

			// Store this delta in a list
			deltas.push(filterOutMissingData(delta));

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

	const finalState = convertPathsIntoSubObjects(flattened) as IFreeSwitchChannelEventMutable;

	const computedProfiles = computeChannelProfiles(finalState?.legs?.[uniqueId]?.profiles || {});

	return {
		channel: {
			uniqueId,
			name: finalState.channelName,
			callDirection: callDirections.join('||'),
			freeSwitchUser: finalState.channelUsername,
			callers,
			callees,
			bridgedTo,
			...{
				...computedProfiles,
				// If we couldn't parse a startedAt, use the time of the first event
				startedAt: computedProfiles.startedAt || firstEvent,
			},
			kind: parseChannelKind(finalState.channelName),
		},
		deltas,
		finalState,
	};
}
