import type { IFreeSwitchChannelEvent } from '@rocket.chat/core-typings';

import { filterOutMissingData } from './filterOutMissingData';
import { filterStringList } from './filterStringList';
import { parseChannelUsername } from './parseChannelUsername';
import { parseEventCallId } from './parseEventCallId';
import { parseEventLeg } from './parseEventLeg';
import { parseTimestamp } from './parseTimestamp';
import { logger } from '../logger';
import { parseEventExtensions } from './parseEventExtensions';

export type EventData = Record<string, string | undefined> & Record<`variable_${string}`, string | string[] | undefined>;

export function parseEventData(eventName: string, eventData: EventData): Omit<IFreeSwitchChannelEvent, '_id' | '_updatedAt'> | undefined {
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
		'Bridged-To': bridgedTo,

		'Presence-Call-Direction': presenceCallDirection,
		'Channel-Presence-ID': channelPresenceId,

		'Channel-Read-Codec-Name': codecReadName,
		'Channel-Read-Codec-Rate': codecReadRate,
		'Channel-Write-Codec-Name': codecWriteName,
		'Channel-Write-Codec-Rate': codecWriteRate,

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

	const callerLeg = parseEventLeg('Caller', eventData);
	const otherLeg = parseEventLeg('Other-Leg', eventData);
	const bridgeUniqueIds = [bridgeA, bridgeB].filter((bridgeId) => bridgeId) as string[];

	const legs: IFreeSwitchChannelEvent['legs'] = {
		...(callerLeg?.uniqueId && { [callerLeg.uniqueId]: callerLeg }),
		...(otherLeg?.uniqueId && { [otherLeg.uniqueId]: otherLeg }),
	};

	const variables = filterStringList(
		eventData,
		(key) => key.startsWith('variable_'),
		([key, value]) => {
			return [key.replace('variable_', ''), value || ''];
		},
	) as Record<string, string | string[]>;
	const metadata = filterStringList(eventData, (key) => isMetadata(key)) as Record<string, string>;
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
	}) as Record<string, string>;

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
		bridgedTo,
		legs,
		metadata: filterOutMissingData(metadata),
		...(Object.keys(variables).length && { variables }),
		raw: filterOutMissingData(unusedRawData),

		codecs: {
			...{
				read: {
					...{
						name: codecReadName,
						rate: codecReadRate,
					},
				},
				write: {
					...{
						nme: codecWriteName,
						rate: codecWriteRate,
					},
				},
			},
		},

		presenceCallDirection,
		channelPresenceId,
	};

	const filteredEvent = {
		...filterOutMissingData(event),
		channelName,
		channelCallState,
		channelState,
	};
	const extensions = parseEventExtensions(filteredEvent);

	return {
		...filteredEvent,
		...extensions,
	};
}

function isMetadata(key: string): boolean {
	return key.startsWith('Event-') || key.startsWith('FreeSWITCH-') || key.startsWith('Core-');
}
