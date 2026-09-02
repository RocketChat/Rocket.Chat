import type { CallHistoryItemState, CallPreventionRecord, IMessage } from '@rocket.chat/core-typings';
import type { IconButtonElement, FrameableIconElement, InfoCardBlock, PlainText, TextObject } from '@rocket.chat/ui-kit';
import { intervalToDuration, secondsToMilliseconds } from 'date-fns';

const APP_ID = 'media-call-core';

export const callStateToTranslationKey = (callState: CallHistoryItemState): TextObject => {
	switch (callState) {
		case 'ended':
			return { type: 'mrkdwn', i18n: { key: 'Call_ended_bold' }, text: 'Call ended' };
		case 'not-answered':
			return { type: 'mrkdwn', i18n: { key: 'Call_not_answered_bold' }, text: 'Call not answered' };
		case 'prevented':
			return { type: 'mrkdwn', i18n: { key: 'Voice_call_not_placed' }, text: 'Voice call not placed' };
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
		case 'prevented':
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

const getPreventedReasonElement = (preventedBy: CallPreventionRecord): PlainText => {
	if ('key' in preventedBy) {
		return {
			type: 'plain_text',
			i18n: { key: preventedBy.key, ns: preventedBy.ns, args: preventedBy.args },
			text: preventedBy.text,
		};
	}
	if (preventedBy.text) {
		return { type: 'plain_text', text: preventedBy.text };
	}
	return {
		type: 'plain_text',
		i18n: { key: 'Prevented_by_app', args: { appName: preventedBy.appName } },
		text: `Prevented by app: ${preventedBy.appName}`,
	};
};

export type HistoryMessagePayloadOptions = {
	state: CallHistoryItemState;
	duration?: number;
	callId?: string;
	msg?: string;
	preventedBy?: CallPreventionRecord;
};

export const getHistoryMessagePayload = ({
	state,
	duration,
	callId,
	msg = '',
	preventedBy,
}: HistoryMessagePayloadOptions): Pick<IMessage, 'msg' | 'groupable'> & { blocks: [InfoCardBlock] } => {
	const prevention = state === 'prevented' ? preventedBy : undefined;
	const secondaryElement = prevention ? getPreventedReasonElement(prevention) : getFormattedCallDuration(duration);

	return {
		msg,
		groupable: false,
		blocks: [
			{
				appId: APP_ID,
				type: 'info_card',
				rows: [
					{
						background: 'default',
						elements: [callStateToIcon(state), callStateToTranslationKey(state)],
						...(callId && { action: getHistoryAction(callId) }),
					},
					...(secondaryElement
						? [
								{
									background: 'secondary',
									elements: [secondaryElement],
								} as const,
							]
						: []),
				],
			},
		],
	};
};
