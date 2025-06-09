import type {
	IFreeSwitchChannelEvent,
	IFreeSwitchChannelEventParsedMutable,
	IFreeSwitchChannelEventCalculated,
} from '@rocket.chat/core-typings';

import { logger } from '../logger';
import { parseChannelUsername } from './parseChannelUsername';

function calculateOutboundEventData(
	channelState: IFreeSwitchChannelEventParsedMutable,
	event: IFreeSwitchChannelEvent,
): IFreeSwitchChannelEventCalculated {
	// const logWarnings = process.env.NODE_ENV === 'development';
	const { callee, caller, rang, answered, bridged, isTransfering, transfered } = channelState;

	const existingValues = {
		callee,
		caller,
		// Outbount channels are created by the ringing process, so this is always true
		rang: rang || true,
		answered,
		bridged,
		isTransfering,
		transfered,
	};

	const originator = Object.values(event.legs).find((leg) => leg.type === 'originator');
	const originatorCaller = originator && parseChannelUsername(originator.channelName);
	const originatorTransfered = originator && ((caller && originator.username !== caller) || Boolean(originator.rdnis));

	// It's a brand new incoming call for this channel
	if (event.eventName === 'CHANNEL_OUTGOING') {
		return {
			callee: event.channelUsername,
			caller: originatorCaller,
			rang: true,
			answered: false,
			bridged: false,
			isTransfering: false,
			transfered: originatorTransfered,
		};
	}

	// Channel is new, but we probably got the info from a CHANNEL_OUTGOING event already
	if (event.channelState === 'CS_NEW' || event.channelState === 'CS_INIT') {
		return {
			callee: existingValues.callee || event.channelUsername,
			caller: existingValues.caller || originatorCaller,
			rang: true,
			answered: false,
			bridged: false,
			isTransfering: false,
			transfered: existingValues.transfered || originatorTransfered,
		};
	}

	return existingValues;
}

function calculateInboundEventData(
	channelState: IFreeSwitchChannelEventParsedMutable,
	event: IFreeSwitchChannelEvent,
): IFreeSwitchChannelEventCalculated {
	const logWarnings = process.env.NODE_ENV === 'development';
	const { callee, caller, rang, answered, bridged, isTransfering, transfered } = channelState;

	const existingValues = {
		callee,
		caller,
		rang,
		answered,
		bridged,
		isTransfering,
		transfered,
	};

	if (event.eventName === 'CHANNEL_OUTGOING') {
		logWarnings && logger.warn('Unexpected inbound CHANNEL_OUTGOING event');
	}

	const isStateChange = event.eventName === 'CHANNEL_STATE' || event.eventName === 'CHANNEL_CALL_STATE';
	const isNowRouting = event.channelState === 'CS_ROUTING' && isStateChange;

	// Channel is being created now, so the info is quite straightforward
	if (event.channelState === 'CS_NEW' || event.channelState === 'CS_INIT' || isNowRouting) {
		return {
			caller: event.channelUsername,
			callee: event.legs[event.channelUniqueId]?.destinationNumber,
			rang: existingValues.rang ?? false,
			answered: false,
			bridged: false,
			isTransfering: false,
			transfered: false,
		};
	}

	if (event.eventName === 'CHANNEL_PROGRESS' && !existingValues.rang) {
		return {
			...existingValues,
			rang: true,
		};
	}

	return existingValues;
}

export function calculateEventData(
	channelState: IFreeSwitchChannelEventParsedMutable,
	event: IFreeSwitchChannelEvent,
): IFreeSwitchChannelEventCalculated {
	if (event.callDirection === 'inbound') {
		return calculateInboundEventData(channelState, event);
	}

	return calculateOutboundEventData(channelState, event);
}
