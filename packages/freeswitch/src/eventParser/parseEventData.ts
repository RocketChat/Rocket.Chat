import type { IFreeSwitchChannelEvent } from '@rocket.chat/core-typings';

import { filterOutEmptyValues, filterOutMissingData } from './filterOutMissingData';
import { filterStringList } from './filterStringList';
import { isMetadata } from './isMetadata';
import { parseChannelUsername } from './parseChannelUsername';
import { parseEventCallId } from './parseEventCallId';
import { parseEventLeg } from './parseEventLeg';
import { parseTimestamp } from './parseTimestamp';
import { logger } from '../logger';

export function parseEventData(
	eventName: string,
	eventData: Record<string, string | undefined>,
): Omit<IFreeSwitchChannelEvent, '_id' | '_updatedAt'> | undefined {
	const {
		'Channel-Name': channelName = '',
		'Channel-State': channelState = '',
		'Channel-Call-State': channelCallState = '',
		'Channel-State-Number': channelStateNumber,
		'Channel-Call-State-Number': channelCallStateNumber,
		'Original-Channel-Call-State': originalChannelCallState,
		'Event-Sequence': sequenceStr,
		'Event-Date-Timestamp': timestamp,
		'Unique-ID': channelUniqueId,

		'Call-Direction': callDirection,
		'Channel-HIT-Dialplan': channelHitDialplan,
		'Answer-State': answerState,

		'Hangup-Cause': hangupCause,

		'Bridge-A-Unique-ID': bridgeA,
		'Bridge-B-Unique-ID': bridgeB,

		'Presence-Call-Direction': presenceCallDirection,
		'Channel-Presence-ID': channelPresenceId,

		...rawEventData
	} = eventData;

	if (!channelUniqueId || !sequenceStr) {
		logger.error({ msg: 'Channel Event is missing either the Unique-ID or Event-Sequence', eventData });
		return;
	}

	const sequence = parseInt(sequenceStr);
	if (!sequence || typeof sequence !== 'number' || !Number.isInteger(sequence)) {
		logger.error({ msg: 'Failed to parse Event-Sequence', eventData });
		return;
	}

	const callUniqueId = parseEventCallId(eventData) || channelUniqueId;
	const channelUsername = parseChannelUsername(channelName);
	const firedAt = parseTimestamp(timestamp) || new Date();

	const callerLeg = parseEventLeg('Caller', rawEventData);
	const otherLeg = parseEventLeg('Other-Leg', rawEventData);
	const bridgeUniqueIds = [bridgeA, bridgeB].filter((bridgeId) => bridgeId) as string[];

	const legs: IFreeSwitchChannelEvent['legs'] = {
		...(callerLeg?.uniqueId && { [callerLeg.uniqueId]: callerLeg }),
		...(otherLeg?.uniqueId && { [otherLeg.uniqueId]: otherLeg }),
	};

	const variables = filterStringList(
		rawEventData,
		(key) => key.startsWith('variable_'),
		([key, value]) => {
			return [key.replace('variable_', ''), value || ''];
		},
	);
	const metadata = filterStringList(eventData, (key) => isMetadata(key));
	const unusedRawData = filterStringList(rawEventData, (key) => {
		if (isMetadata(key)) {
			return false;
		}
		if (key.startsWith('variable_')) {
			return false;
		}

		for (const { legName } of Object.values(legs)) {
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
		channelStateNumber,
		channelCallStateNumber,
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

		presenceCallDirection,
		channelPresenceId,
	};

	return filterOutMissingData(event) as typeof event;
}
