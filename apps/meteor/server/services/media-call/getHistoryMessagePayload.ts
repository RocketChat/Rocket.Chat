import type { CallHistoryItemState, IMessage } from '@rocket.chat/core-typings';
import type { IconElement, InfoCardBlock, TextObject } from '@rocket.chat/ui-kit';
import { intervalToDuration, secondsToMilliseconds } from 'date-fns';

const APP_ID = 'media-call-core';

// TODO bold the text
export const callStateToTranslationKey = (callState: CallHistoryItemState): TextObject => {
	switch (callState) {
		case 'ended':
			return { type: 'mrkdwn', i18n: { key: 'Call_ended_bold' }, text: 'Call ended' };
		case 'not-answered':
			return { type: 'mrkdwn', i18n: { key: 'Call_not_answered_bold' }, text: 'Call not answered' };
		case 'failed':
		case 'error':
			return { type: 'mrkdwn', i18n: { key: 'Call_failed_bold' }, text: 'Call failed' };
		case 'transferred':
			return { type: 'mrkdwn', i18n: { key: 'Call_transferred_bold' }, text: 'Call transferred' };
	}
};

export const callStateToIcon = (callState: CallHistoryItemState): IconElement => {
	switch (callState) {
		case 'ended':
			return { type: 'icon', icon: 'phone-off', variant: 'secondary' };
		case 'not-answered':
			return { type: 'icon', icon: 'clock', variant: 'danger' };
		case 'failed':
		case 'error':
			return { type: 'icon', icon: 'phone-issue', variant: 'danger' };
		case 'transferred':
			return { type: 'icon', icon: 'arrow-forward', variant: 'secondary' };
	}
};

const buildDurationString = (...values: number[]): string => {
	return values.map((value) => value.toString().padStart(2, '0')).join(':');
};

export const getFormattedCallDuration = (callDuration: number | undefined, callState: CallHistoryItemState): TextObject | undefined => {
	if (callState !== 'ended' && callState !== 'transferred') {
		return undefined;
	}

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
	const callDurationFormatted = getFormattedCallDuration(callDuration, callState);

	return {
		msg: '',
		groupable: false,
		blocks: [
			{
				appId: APP_ID,
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
