import type { Keys as IconName } from '@rocket.chat/icons';
import { ContextualbarActions, ContextualbarClose, GenericMenu } from '@rocket.chat/ui-client';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

type HistoryActions = 'voiceCall' | 'videoCall' | 'jumpToMessage' | 'directMessage' | 'userInfo';

export type HistoryActionCallbacks = {
	[K in HistoryActions]?: () => void;
};

type CallHistoryActionsProps = {
	onClose: () => void;
	actions: HistoryActionCallbacks;
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

const getItems = (actions: HistoryActionCallbacks, t: TFunction) => {
	return (Object.entries(actions) as [HistoryActions, () => void][])
		.filter(([_, callback]) => callback)
		.map(([action, callback]) => ({
			id: action,
			icon: iconDictionary[action],
			content: t(i18nDictionary[action]),
			onClick: callback,
		}));
};

const CallHistoryActions = ({ onClose, actions }: CallHistoryActionsProps) => {
	const { t } = useTranslation();

	const items = getItems(actions, t);
	return (
		<ContextualbarActions>
			{items.length > 0 && <GenericMenu title={t('Options')} items={items} />}
			<ContextualbarClose onClick={onClose} />
		</ContextualbarActions>
	);
};

export default CallHistoryActions;
