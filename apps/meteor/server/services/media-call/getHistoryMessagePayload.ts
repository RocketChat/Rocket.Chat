import type { CallHistoryItemState, IMessage } from '@rocket.chat/core-typings';
import type { IconElement, InfoCardBlock, TextObject } from '@rocket.chat/ui-kit';
import { intervalToDuration, secondsToMilliseconds } from 'date-fns';

// TODO bold the text
export const callStateToTranslationKey = (callState: CallHistoryItemState): TextObject => {
	switch (callState) {
		case 'ended':
			return { type: 'mrkdwn', text: 'Call_ended' };
		case 'not-answered':
			return { type: 'mrkdwn', text: 'Call_not_answered' };
		case 'failed':
		case 'error':
			return { type: 'mrkdwn', text: 'Call_failed' };
		case 'transferred':
			return { type: 'mrkdwn', text: 'Call_transferred' };
	}
};

export const callStateToIcon = (callState: CallHistoryItemState): IconElement => {
	switch (callState) {
		case 'ended':
			return { type: 'icon', icon: 'phone-off', variant: 'default' };
		case 'not-answered':
			return { type: 'icon', icon: 'clock', variant: 'danger' };
		case 'failed':
		case 'error':
			return { type: 'icon', icon: 'phone-issue', variant: 'danger' };
		case 'transferred':
			return { type: 'icon', icon: 'arrow-forward', variant: 'default' };
	}
};

const buildDurationString = (...values: number[]): string => {
	return values.map((value) => value.toString().padStart(2, '0')).join(':');
};

export const getFormattedCallDuration = (callDuration: number | undefined): TextObject | undefined => {
	if (typeof callDuration !== 'number') {
		return undefined;
	}

	const milliseconds = secondsToMilliseconds(callDuration);
	const duration = { minutes: 0, seconds: 0, ...intervalToDuration({ start: 0, end: milliseconds }) };

	if (duration.hours && duration.hours > 0) {
		return { type: 'mrkdwn', text: `*${buildDurationString(duration.hours, duration.minutes, duration.seconds)}*` } as const;
	}

	return {
		type: 'mrkdwn',
		text: `*${buildDurationString(duration.minutes, duration.seconds)}*`,
	} as const;
};

// TODO proper translation keys
export const getHistoryMessagePayload = (
	callState: CallHistoryItemState,
	callDuration: number | undefined,
): Pick<IMessage, 'msg' | 'groupable'> & { blocks: [InfoCardBlock] } => {
	const callStateTranslationKey = callStateToTranslationKey(callState);
	const icon = callStateToIcon(callState);
	const callDurationFormatted = getFormattedCallDuration(callDuration);

	return {
		msg: '',
		groupable: false,
		blocks: [
			{
				type: 'info_card',
				rows: [
					{
						background: 'default',
						elements: [icon, callStateTranslationKey],
					},
					...(callDurationFormatted
						? [
								{
									background: 'secondary',
									elements: [callDurationFormatted],
								} as const,
							]
						: []),
				],
			},
		],
	};
};
