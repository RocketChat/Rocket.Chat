import type { Keys as IconName } from '@rocket.chat/icons';
import type { PeekMediaSessionStateReturn } from '@rocket.chat/ui-voip';
import type { TFunction } from 'i18next';

export type HistoryActions = 'voiceCall' | 'videoCall' | 'jumpToMessage' | 'directMessage' | 'userInfo';

export type HistoryActionCallbacks = {
	[K in HistoryActions]?: () => void;
};

const iconDictionary: Record<HistoryActions, IconName> = {
	voiceCall: 'phone',
	videoCall: 'video',
	jumpToMessage: 'jump',
	directMessage: 'balloon',
	userInfo: 'user',
} as const;

const i18nDictionary: Record<HistoryActions, string> = {
	voiceCall: 'Voice_call',
	videoCall: 'Video_call',
	jumpToMessage: 'Jump_to_message',
	directMessage: 'Direct_Message',
	userInfo: 'User_info',
} as const;

/** The options menu of a call history row; a voice call is offered only while no call is under way. */
export const getItems = (actions: HistoryActionCallbacks, t: TFunction, state: PeekMediaSessionStateReturn) => {
	return (Object.entries(actions) as [HistoryActions, () => void][])
		.filter(([_, callback]) => callback)
		.map(([action, callback]) => {
			const disabled = action === 'voiceCall' && state !== 'available';
			return {
				id: action,
				icon: iconDictionary[action],
				content: t(i18nDictionary[action]),
				disabled,
				tooltip: disabled ? t('Call_in_progress') : undefined,
				onClick: callback,
			};
		});
};
