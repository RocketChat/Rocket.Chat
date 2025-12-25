import type { CallHistoryItemState, IMessage } from '@rocket.chat/core-typings';
import type { IconButtonElement, FrameableIconElement, InfoCardBlock, TextObject } from '@rocket.chat/ui-kit';
import { intervalToDuration, secondsToMilliseconds } from 'date-fns';

const APP_ID = 'media-call-core';

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

export const callStateToIcon = (callState: CallHistoryItemState): FrameableIconElement => {
	switch (callState) {
		case 'ended':
			return { type: 'icon', icon: 'phone-off', variant: 'secondary', framed: true };
		case 'not-answered':
			return { type: 'icon', icon: 'phone-question-mark', variant: 'warning', framed: true };
		case 'failed':
		case 'error':
			return { type: 'icon', icon: 'phone-issue', variant: 'danger', framed: true };
		case 'transferred':
			return { type: 'icon', icon: 'arrow-forward', variant: 'secondary', framed: true };
	}
};

const buildDurationString = (...values: number[]): string => {
	return values.map((value) => value.toString().padStart(2, '0')).join(':');
};

export const getCallDurationText = (callDuration: number | undefined): string | undefined => {
	if (!callDuration || typeof callDuration !== 'number') {
		return undefined;
	}

	const milliseconds = secondsToMilliseconds(callDuration);
	const duration = { minutes: 0, seconds: 0, ...intervalToDuration({ start: 0, end: milliseconds }) };

	if (duration.hours && duration.hours > 0) {
		return buildDurationString(duration.hours, duration.minutes, duration.seconds);
	}
	return buildDurationString(duration.minutes, duration.seconds);
};

export const getFormattedCallDuration = (callDuration: number | undefined): TextObject | undefined => {
	const callDurationText = getCallDurationText(callDuration);
	if (!callDurationText) {
		return undefined;
	}

	return {
		type: 'mrkdwn',
		text: `*${callDurationText}*`,
	} as const;
};

export const getHistoryAction = (callId: string): IconButtonElement => {
	return {
		type: 'icon_button',
		icon: { type: 'icon', icon: 'info', variant: 'default' },
		actionId: 'open-history',
		appId: APP_ID,
		blockId: callId,
	};
};

export const getHistoryMessagePayload = (
	callState: CallHistoryItemState,
	callDuration: number | undefined,
	callId?: string,
): Pick<IMessage, 'msg' | 'groupable'> & { blocks: [InfoCardBlock] } => {
	const callStateTranslationKey = callStateToTranslationKey(callState);
	const icon = callStateToIcon(callState);
	const callDurationFormatted = getFormattedCallDuration(callDuration);

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
						...(callId && { action: getHistoryAction(callId) }),
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
