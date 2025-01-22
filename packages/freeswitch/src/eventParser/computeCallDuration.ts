import type { IFreeSwitchCallEvent } from '@rocket.chat/core-typings';

import { parseTimestamp } from './parseTimestamp';

export function computeCallDuration(callEvents: IFreeSwitchCallEvent[]): number {
	if (!callEvents?.length) {
		return 0;
	}

	const channelAnswerEvent = callEvents.find((e) => e.eventName === 'CHANNEL_ANSWER');
	if (!channelAnswerEvent?.timestamp) {
		return 0;
	}

	const answer = parseTimestamp(channelAnswerEvent.timestamp);
	if (!answer) {
		return 0;
	}

	const channelHangupEvent = callEvents.find((e) => e.eventName === 'CHANNEL_HANGUP_COMPLETE');
	if (!channelHangupEvent?.timestamp) {
		// We dont have a hangup but we have an answer, assume hangup is === destroy time
		return new Date().getTime() - answer.getTime();
	}

	const hangup = parseTimestamp(channelHangupEvent.timestamp);
	if (!hangup) {
		return 0;
	}

	return hangup.getTime() - answer.getTime();
}
