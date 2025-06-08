import type { AtLeast, IFreeSwitchChannelEventLeg, ValueOf } from '@rocket.chat/core-typings';

import { filterOutEmptyValues } from './filterOutMissingData';
import { filterStringList } from './filterStringList';
import { parseTimestamp } from './parseTimestamp';

export type PickType<T, K extends ValueOf<T>> = {
	-readonly [p in keyof T]: T[p] extends keyof K ? T[p] : undefined;
};

export function parseEventLeg(
	legName: string,
	eventData: Record<string, string | undefined>,
): AtLeast<IFreeSwitchChannelEventLeg, 'legName' | 'uniqueId' | 'raw'> | undefined {
	const legData = filterStringList(
		eventData,
		(key) => key.startsWith(`${legName}-`),
		([key, value]) => {
			return [key.replace(`${legName}-`, ''), value];
		},
	);

	const legType = legName === 'Other-Leg' ? eventData['Other-Type'] : undefined;

	const {
		'Direction': direction,
		'Logical-Direction': logicalDirection,
		'Username': username,
		'Caller-ID-Name': callerName,
		'Caller-ID-Number': callerNumber,
		'Orig-Caller-ID-Name': originalCallerName,
		'Orig-Caller-ID-Number': originalCallerNumber,
		'Callee-ID-Name': calleeName,
		'Callee-ID-Number': calleeNumber,
		'Network-Addr': networkAddress,
		'Destination-Number': destinationNumber,
		'Unique-ID': uniqueId,
		'Source': source,
		'Context': context,
		'Channel-Name': channelName,
		...rawLegData
	} = legData;

	if (!uniqueId) {
		return;
	}

	const timestamps: Partial<IFreeSwitchChannelEventLeg> = {
		profileCreatedTime: parseTimestamp(rawLegData['Profile-Created-Time']),
		channelCreatedTime: parseTimestamp(rawLegData['Channel-Created-Time']),
		channelAnsweredTime: parseTimestamp(rawLegData['Channel-Answered-Time']),
		channelProgressTime: parseTimestamp(rawLegData['Channel-Progress-Time']),
		channelBridgedTime: parseTimestamp(rawLegData['Channel-Bridged-Time']),
		channelProgressMediaTime: parseTimestamp(rawLegData['Channel-Progress-Media-Time']),
		channelHangupTime: parseTimestamp(rawLegData['Channel-Hangup-Time']),
	};

	const leg: AtLeast<IFreeSwitchChannelEventLeg, 'legName' | 'uniqueId' | 'raw'> = {
		legName,
		uniqueId,
		type: legType,
		direction,
		logicalDirection,
		username,
		callerName,
		callerNumber,
		originalCallerName,
		originalCallerNumber,
		calleeName,
		calleeNumber,
		networkAddress,
		destinationNumber,
		source,
		context,
		channelName,
		...timestamps,
		raw: filterOutEmptyValues(rawLegData),
	};

	return Object.fromEntries(Object.entries(leg).filter(([key]) => leg[key as keyof typeof leg])) as typeof leg;
}
