import type { IFreeSwitchCall, IFreeSwitchCallEvent, IFreeSwitchEvent, IFreeSwitchEventCallUser } from '@rocket.chat/core-typings';

import { computeCallDuration } from './computeCallDuration';
import { getCallEventType } from './getCallEventType';
import { getPreferableUserFromUserList } from './getPreferableUserFromUserList';
import { getRelevantRawData } from './getRelevantRawData';
import { mergeCallChannelData } from './mergeCallChannelData';
import { mergeCallUserData } from './mergeCallUserData';

function sortEvents(allEvents: IFreeSwitchEvent[]): IFreeSwitchEvent[] {
	// Sort events by both sequence and timestamp, but only when they are present
	return allEvents.sort((event1: IFreeSwitchEvent, event2: IFreeSwitchEvent) => {
		if (event1.sequence && event2.sequence) {
			return event1.sequence.localeCompare(event2.sequence);
		}

		if (event1.firedAt && event2.firedAt) {
			return event1.firedAt.valueOf() - event2.firedAt.valueOf();
		}

		if (event1.sequence || event2.sequence) {
			return (event1.sequence || '').localeCompare(event2.sequence || '');
		}

		return (event1.firedAt?.valueOf() || 0) - (event2.firedAt?.valueOf() || 0);
	});
}

async function iterateOverEvents(sortedEvents: IFreeSwitchEvent[]): Promise<{
	isValidCall: boolean;
	callEvents: IFreeSwitchCallEvent[];
	startedAt: Date | undefined;
}> {
	const callEvents: IFreeSwitchCallEvent[] = [];
	let startedAt: Date | undefined;
	let isValidCall = false;

	for await (const event of sortedEvents) {
		if (event.firedAt && (!startedAt || (event.firedAt && event.firedAt < startedAt))) {
			startedAt = event.firedAt;
		}

		const workspaces = [...new Set((event.users || []).map(({ workspaceUrl }) => workspaceUrl).filter((w) => w) as string[])];
		const eventType = getCallEventType(event);

		if (['RINGING', 'ANSWER', 'CREATE', 'BRIDGE'].includes(eventType)) {
			isValidCall = true;
		}

		const eventData: IFreeSwitchCallEvent = {
			type: eventType,
			eventName: event.eventName,
			sequence: event.sequence,
			firedAt: event.firedAt,

			channel: event.channel,
			call: event.call,
			...(event.caller && { caller: event.caller }),
			...(event.callee && { callee: event.callee }),

			...(workspaces.length && { workspaces }),
			raw: getRelevantRawData(event.raw),
			eventId: event._id,
		};

		const lastEvent = (callEvents.length && callEvents[callEvents.length - 1]) || undefined;
		if (lastEvent?.type === eventType && lastEvent.channel?.uniqueId === event.channel?.uniqueId) {
			lastEvent.extraEvents = [...(lastEvent.extraEvents || []), eventData];
			continue;
		}

		callEvents.push(eventData);
	}

	return {
		isValidCall,
		callEvents,
		startedAt,
	};
}

export async function computeCallFromParsedEvents(
	callUUID: string,
	allEvents: IFreeSwitchEvent[],
	workspaceUrl: string,
): Promise<
	| (Omit<IFreeSwitchCall, '_id' | '_updatedAt' | 'to' | 'from' | 'forwardedFrom'> & {
			caller?: IFreeSwitchEventCallUser;
			callee?: IFreeSwitchEventCallUser;
	  })
	| undefined
> {
	const sortedEvents = sortEvents(allEvents);

	const callers = mergeCallUserData(sortedEvents.map(({ caller }) => caller));
	const callees = mergeCallUserData(sortedEvents.map(({ callee }) => callee));
	const directChannels = sortedEvents.map(({ channel }) => channel);
	const linkedChannels = sortedEvents.map(({ otherChannels }) => otherChannels).flat();
	const channels = mergeCallChannelData(directChannels, linkedChannels);

	const caller = getPreferableUserFromUserList(callers);
	const callee = getPreferableUserFromUserList(callees);

	const users = [...callers, ...callees];

	// when a call enters the voicemail, freeswitch creates separate channels for it, with 'voicemail' in their names
	const hasVoicemailChannel = channels.some(({ name }) => name?.includes('voicemail'));
	const hasVoicemailCallee = callees.some(({ isVoicemail }) => isVoicemail);
	const { isValidCall, callEvents, startedAt } = await iterateOverEvents(sortedEvents);

	if (!isValidCall) {
		return undefined;
	}

	const workspaces = [...new Set(callEvents.map(({ workspaces }) => workspaces).flat())].filter((w) => w) as string[];
	const fromUs = caller?.workspaceUrl === workspaceUrl;
	const toUs = callee?.workspaceUrl === workspaceUrl || (!callee?.reached && fromUs);

	if (!fromUs && !toUs) {
		return undefined;
	}

	const direction: IFreeSwitchCall['direction'] = fromUs && toUs ? 'internal' : `external_${fromUs ? 'outbound' : 'inbound'}`;

	return {
		UUID: callUUID,
		channels,
		events: callEvents,
		voicemail: hasVoicemailCallee || hasVoicemailChannel,
		startedAt,
		caller,
		callee,
		...(workspaces.length && { workspaces }),
		users,
		direction,
		duration: computeCallDuration(callEvents),
	};
}
