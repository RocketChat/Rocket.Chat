import type { IFreeSwitchEvent, IFreeSwitchEventCallUser } from '@rocket.chat/core-typings';

import { filterOutMissingData } from './filterOutMissingData';
import { getEventType } from './getCallEventType';
import { getDetailedEventName } from './getDetailedEventName';
import { parseEventCallData } from './parseEventCallData';
import { parseEventCallee } from './parseEventCallee';
import { parseEventCaller } from './parseEventCaller';
import { parseEventChannel } from './parseEventChannel';
import { parseRocketChatVariables } from './parseRocketChatVariables';
import { parseTimestamp } from './parseTimestamp';

export async function parseEventData(
	eventName: string,
	rawData: Record<string, string | undefined>,
): Promise<Omit<IFreeSwitchEvent, '_id' | '_updatedAt'> | undefined> {
	const eventData: Record<string, string> = Object.fromEntries(
		Object.entries(rawData).filter(([_, value]) => value !== undefined && value !== '0'),
	) as Record<string, string>;

	const state = eventData['Channel-State'];
	const callState = eventData['Channel-Call-State'];
	const eventType = getEventType(eventName, state, callState);

	if (
		![
			'INIT',
			'CREATE',
			'RINGING',
			'OUTGOING',
			'ORIGINATE',
			'ANSWER',
			'EARLY',
			'ACTIVE',
			'BRIDGE',
			'UNBRIDGE',
			'HANGUP',
			'DESTROY',
			'HANGUP_COMPLETE',
			'RING_WAIT',
		].includes(eventType)
	) {
		return;
	}

	const detaildEventName = getDetailedEventName(eventName, eventData);

	const otherLegUniqueId = eventData['Other-Leg-Unique-ID'];
	const loopbackLegUniqueId = eventData.variable_other_loopback_leg_uuid;
	const loopbackFromUniqueId = eventData.variable_other_loopback_from_uuid;
	const oldUniqueId = eventData['Old-Unique-ID'];

	const referencedIds = [otherLegUniqueId, loopbackLegUniqueId, loopbackFromUniqueId, oldUniqueId].filter((id) => Boolean(id)) as string[];
	const firedAt = parseTimestamp(eventData['Event-Date-Timestamp']);

	const loadUsers = eventName !== 'CHANNEL_DESTROY';

	const channel = parseEventChannel(eventData);
	const call = parseEventCallData(eventData);
	const caller = (loadUsers && parseEventCaller(eventData)) || undefined;
	const callee = (loadUsers && parseEventCallee(eventData)) || undefined;
	const users = [caller?.from, callee?.to].filter((u) => u) as IFreeSwitchEventCallUser[];

	const rocketChatVariables = parseRocketChatVariables(eventData, users);

	return filterOutMissingData({
		eventName,
		detaildEventName,
		sequence: eventData['Event-Sequence'],
		firedAt,
		referencedIds,
		receivedAt: new Date(),
		channel,
		caller,
		callee,
		call,
		users,
		raw: eventData,
		rocketChatVariables,
	}) as Omit<IFreeSwitchEvent, '_id' | '_updatedAt'>;
}
