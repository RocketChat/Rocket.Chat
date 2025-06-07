import type { IFreeSwitchCallEventType, IFreeSwitchEvent } from '@rocket.chat/core-typings';
import { isKnownFreeSwitchEventType } from '@rocket.chat/core-typings';

export function getEventType(eventName: string, state?: string, callState?: string): IFreeSwitchCallEventType {
	const modifiedEventName = eventName.toUpperCase().replace('CHANNEL_', '').replace('_COMPLETE', '');

	if (isKnownFreeSwitchEventType(modifiedEventName)) {
		return modifiedEventName;
	}

	if (modifiedEventName === 'STATE') {
		if (!state) {
			return 'OTHER_STATE';
		}

		const modifiedState = state.toUpperCase().replace('CS_', '');
		if (isKnownFreeSwitchEventType(modifiedState)) {
			return modifiedState;
		}
	}

	if (modifiedEventName === 'CALLSTATE') {
		if (!callState) {
			return 'OTHER_CALL_STATE';
		}

		const modifiedCallState = callState.toUpperCase().replace('CS_', '');
		if (isKnownFreeSwitchEventType(modifiedCallState)) {
			return modifiedCallState;
		}
	}

	return 'OTHER';
}

export function getCallEventType(event: IFreeSwitchEvent): IFreeSwitchCallEventType {
	const { eventName, call: { state: callState } = {}, channel: { state } = {} } = event;

	return getEventType(eventName, state, callState);
}
