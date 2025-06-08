import type { IFreeSwitchChannel, IFreeSwitchChannelEvent } from '@rocket.chat/core-typings';

import { computeCallDuration } from './computeCallDuration';
// import { getCallEventType } from './getCallEventType';
import { getPreferableUserFromUserList } from './getPreferableUserFromUserList';
import { getRelevantRawData } from './getRelevantRawData';
import { mergeCallChannelData } from './mergeCallChannelData';
import { mergeCallUserData } from './mergeCallUserData';
import { convertSubObjectsIntoPaths } from '@rocket.chat/tools';

function sortEvents(allEvents: IFreeSwitchChannelEvent[]): IFreeSwitchChannelEvent[] {
	// Sort events by both sequence and timestamp, but only when they are present
	return allEvents.sort((event1: IFreeSwitchChannelEvent, event2: IFreeSwitchChannelEvent) => {
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

async function iterateOverEvents(sortedEvents: IFreeSwitchChannelEvent[]): Promise<{
	isValidCall: boolean;
	callEvents: IFreeSwitchCallEvent[];
	startedAt: Date | undefined;
}> {
	const callEvents: IFreeSwitchCallEvent[] = [];
	let startedAt: Date | undefined;
	// let isValidCall = false;

	for await (const event of sortedEvents) {
		if (event.firedAt && (!startedAt || (event.firedAt && event.firedAt < startedAt))) {
			startedAt = event.firedAt;
		}

		const workspaces = [...new Set((event.users || []).map(({ workspaceUrl }) => workspaceUrl).filter((w) => w) as string[])];
		// const eventType = getCallEventType(event);

		// if (['RINGING', 'ANSWER', 'CREATE', 'BRIDGE', 'RING_WAIT'].includes(eventType)) {
		// 	isValidCall = true;
		// }

		const eventData: IFreeSwitchCallEvent = {
			type: 'INIT',
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

		// const lastEvent = (callEvents.length && callEvents[callEvents.length - 1]) || undefined;
		// if (lastEvent?.type === eventType && lastEvent.channel?.uniqueId === event.channel?.uniqueId) {
		// 	lastEvent.extraEvents = [...(lastEvent.extraEvents || []), eventData];
		// 	continue;
		// }

		callEvents.push(eventData);
	}

	return {
		isValidCall: true,
		callEvents,
		startedAt,
	};
}

export async function computeChannelFromParsedEvents(
	callUUID: string,
	allEvents: IFreeSwitchChannelEvent[],
	workspaceUrl: string,
): Promise<Omit<IFreeSwitchChannel, '_id' | '_updatedAt'> | undefined> {
	const sortedEvents = sortEvents(allEvents);

	sortedEvents.reduce(
		(state: Record<string, any>, nextEvent: IFreeSwitchChannelEvent): Record<string, any> => {
			const { _id, channelUniqueId, _updatedAt, ...eventData } = nextEvent;

			const eventValues = convertSubObjectsIntoPaths(eventData);
			// Comparar o eventValues com o state, gerando um objeto novo com o que tiver de diferente 
			// Depois aplicar essas diferenças no state pra poder comparar o próximo
			// Arrays precisam de atenção especial

			// Cuidado, o `variables` pode ter arrays tb.


			return prev;
		},
		{} as Record<string, any>,
	);

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
