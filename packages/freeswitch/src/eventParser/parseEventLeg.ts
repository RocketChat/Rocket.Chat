import type { AtLeast, IFreeSwitchChannelEventLeg, ValueOf } from '@rocket.chat/core-typings';

import { filterOutEmptyValues, filterOutMissingData } from './filterOutMissingData';
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

		'Dialplan': dialplan,
		'Profile-Index': profileIndex,
		'ANI': ani,
		'RDNIS': rdnis,
		'Transfer-Source': transferSource,
		'Screen-Bit': screenBit,
		'Privacy-Hide-Name': privacyHideName,
		'Privacy-Hide-Number': privacyHideNumber,

		'Profile-Created-Time': profileCreatedTime,
		'Channel-Created-Time': channelCreatedTime,
		'Channel-Answered-Time': channelAnsweredTime,
		'Channel-Progress-Time': channelProgressTime,
		'Channel-Bridged-Time': channelBridgedTime,
		'Channel-Progress-Media-Time': channelProgressMediaTime,
		'Channel-Hangup-Time': channelHangupTime,
		'Channel-Transfer-Time': channelTransferTime,
		'Channel-Resurrect-Time': channelRessurectTime,
		'Channel-Last-Hold': channelLastHold,
		...rawLegData
	} = legData;

	if (!uniqueId) {
		return;
	}

	const timestamps: Partial<IFreeSwitchChannelEventLeg> = {
		profileCreatedTime: parseTimestamp(profileCreatedTime),
		channelCreatedTime: parseTimestamp(channelCreatedTime),
		channelAnsweredTime: parseTimestamp(channelAnsweredTime),
		channelProgressTime: parseTimestamp(channelProgressTime),
		channelBridgedTime: parseTimestamp(channelBridgedTime),
		channelProgressMediaTime: parseTimestamp(channelProgressMediaTime),
		channelHangupTime: parseTimestamp(channelHangupTime),
		channelTransferTime: parseTimestamp(channelTransferTime),
		channelRessurectTime: parseTimestamp(channelRessurectTime),
		channelLastHold: parseTimestamp(channelLastHold),
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
		profileIndex,
		transferSource,

		...timestamps,

		dialplan,
		ani,
		rdnis,
		screenBit,
		privacyHideName,
		privacyHideNumber,

		raw: filterOutEmptyValues(rawLegData),
	};

	return filterOutMissingData(leg) as typeof leg;
}
