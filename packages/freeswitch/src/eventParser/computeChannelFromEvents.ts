import type {
	IFreeSwitchChannel,
	IFreeSwitchChannelEvent,
	IFreeSwitchChannelEventDeltaData,
	IFreeSwitchChannelEventMutable,
} from '@rocket.chat/core-typings';
import { convertPathsIntoSubObjects } from '@rocket.chat/tools';

import { computeChannelProfiles } from './computeChannelProfiles';
import { convertEventDataIntoPaths } from './convertEventDataIntoPaths';
import { extractChannelChangesFromEvent } from './extractChannelChangesFromEvent';
import { filterOutMissingData } from './filterOutMissingData';

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
	const uniqueId = allEvents[0].channelUniqueId;
	const callDirections: string[] = [];
	const callers: string[] = [];
	const callees: string[] = [];
	const bridgedTo: string[] = [];

	let firstEvent: Date | undefined;

	const flattened = allEvents.reduce(
		(state, nextEvent: IFreeSwitchChannelEvent) => {
			const { _id, channelUniqueId, _updatedAt, metadata, eventName, sequence, firedAt, receivedAt, callee, caller, ...eventData } =
				nextEvent;

			if (firedAt && (!firstEvent || firstEvent > firedAt)) {
				firstEvent = firedAt;
			}
			if (receivedAt && (!firstEvent || firstEvent > receivedAt)) {
				firstEvent = receivedAt;
			}

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

			const eventValues = convertEventDataIntoPaths(channelUniqueId, eventData, { callee, bridgedTo: eventData.bridgedTo });

			const { changedValues, newValues, changedExistingValues } = extractChannelChangesFromEvent(state, eventName, eventValues);
			const delta: IFreeSwitchChannelEventDeltaData = {
				eventName,
				sequence,
				firedAt,
				receivedAt,
				caller,
				callee,

				newValues: convertPathsIntoSubObjects(newValues),
				modifiedValues: convertPathsIntoSubObjects(changedExistingValues),
			};

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
				// If we couldn't parse a startedAt, use the time of the first event; Current date is just a default for a hypothetical "no events" case,
				startedAt: computedProfiles.startedAt || firstEvent || new Date(),
			},
			kind: 'internal',
		},
		deltas,
		finalState,
	};
}
