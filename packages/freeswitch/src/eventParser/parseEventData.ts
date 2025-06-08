import type { IFreeSwitchChannelEvent } from '@rocket.chat/core-typings';

import { filterOutEmptyValues } from './filterOutMissingData';
import { filterStringList } from './filterStringList';
import { parseEventCallId } from './parseEventCallId';
import { parseEventLeg } from './parseEventLeg';
import { parseEventUsername } from './parseEventUsername';
import { parseTimestamp } from './parseTimestamp';

export function parseEventData(
	eventName: string,
	eventData: Record<string, string | undefined>,
): Omit<IFreeSwitchChannelEvent, '_id' | '_updatedAt'> | undefined {
	const {
		'Channel-Name': channelName = '',
		'Channel-State': channelState = '',
		'Channel-Call-State': channelCallState = '',
		'Original-Channel-Call-State': originalChannelCallState,
		'Event-Sequence': sequence,
		'Event-Date-Timestamp': timestamp,
		'Unique-ID': channelUniqueId,

		'Call-Direction': callDirection,
		'Channel-HIT-Dialplan': channelHitDialplan,
		'Answer-State': answerState,

		'Hangup-Cause': hangupCause,

		'Bridge-A-Unique-ID': bridgeA,
		'Bridge-B-Unique-ID': bridgeB,

		...rawEventData
	} = eventData;

	if (!channelUniqueId || !sequence) {
		// #ToDo: Log as error
		return;
	}

	const callUniqueId = parseEventCallId(eventData) || channelUniqueId;
	const channelUsername = parseEventUsername(eventData);
	const firedAt = parseTimestamp(timestamp) || new Date();

	const callerLeg = parseEventLeg('Caller', rawEventData);
	const otherLeg = parseEventLeg('Other-Leg', rawEventData);
	const bridgeUniqueIds = [bridgeA, bridgeB].filter((bridgeId) => bridgeId) as string[];

	const legs = [callerLeg, otherLeg].filter((leg) => leg) as IFreeSwitchChannelEvent['legs'];

	const variables = filterStringList(
		rawEventData,
		(key) => key.startsWith('variable_'),
		([key, value]) => {
			return [key.replace('variable_', ''), value || ''];
		},
	);
	const metadata = filterStringList(eventData, (key) => key.startsWith('Event-') || key.startsWith('FreeSWITCH-'));
	const unusedRawData = filterStringList(rawEventData, (key) => {
		if (key.startsWith('Event-') || key.startsWith('FreeSWITCH-')) {
			return false;
		}
		if (key.startsWith('variable_')) {
			return false;
		}

		for (const { legName } of legs) {
			if (key.startsWith(`${legName}-`)) {
				return false;
			}
		}

		if (otherLeg && key === 'Other-Type') {
			return false;
		}

		if (key === 'Channel-Call-UUID') {
			return rawEventData['Channel-Call-UUID'] !== callUniqueId;
		}

		return true;
	});

	const event: Omit<IFreeSwitchChannelEvent, '_id' | '_updatedAt'> = {
		channelUniqueId,
		eventName,
		sequence,
		firedAt,
		receivedAt: new Date(),
		callUniqueId,
		channelName,
		channelState,
		channelCallState,

		originalChannelCallState,
		channelUsername,
		answerState,
		callDirection,
		channelHitDialplan,
		hangupCause,

		...(bridgeUniqueIds.length && { bridgeUniqueIds }),
		legs,
		metadata: filterOutEmptyValues(metadata),
		...(Object.keys(variables).length && { variables }),
		raw: filterOutEmptyValues(unusedRawData),
	};

	return Object.fromEntries(Object.entries(event).filter(([key]) => event[key as keyof typeof event])) as typeof event;
}
