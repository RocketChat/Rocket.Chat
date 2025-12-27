import type { Keys as IconName } from '@rocket.chat/icons';
import { GenericMenu } from '@rocket.chat/ui-client';
import { CallHistoryTableRow } from '@rocket.chat/ui-voip';
import type { CallHistoryTableRowProps, CallHistoryTableInternalContact } from '@rocket.chat/ui-voip';
import type { TFunction } from 'i18next';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useMediaCallInternalHistoryActions } from './useMediaCallInternalHistoryActions';

type CallHistoryRowInternalUserProps = Omit<CallHistoryTableRowProps<CallHistoryTableInternalContact>, 'onClick' | 'menu'> & {
	messageId?: string;
	rid: string;
	onClickUserInfo?: (userId: string, rid: string) => void;
	onClick: (historyId: string) => void;
};

type HistoryActions = 'voiceCall' | 'videoCall' | 'jumpToMessage' | 'directMessage' | 'userInfo';

type HistoryActionCallbacks = {
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

const CallHistoryRowInternalUser = ({
	_id,
	contact,
	type,
	status,
	duration,
	timestamp,
	messageId,
	rid,
	onClickUserInfo,
	onClick,
}: CallHistoryRowInternalUserProps) => {
	const { t } = useTranslation();
	const actions = useMediaCallInternalHistoryActions({
		contact: {
			_id: contact._id,
			username: contact.username ?? '',
			name: contact.name,
			displayName: contact.name || contact.username,
		},
		messageId,
		messageRoomId: rid,
		openUserInfo: onClickUserInfo ? (userId) => onClickUserInfo(userId, rid) : undefined,
	});

	const items = getItems(actions, t);

	const handleClick = useCallback(() => {
		onClick(_id);
	}, [onClick, _id]);
	return (
		<CallHistoryTableRow
			_id={_id}
			contact={contact}
			type={type}
			status={status}
			duration={duration}
			timestamp={timestamp}
			onClick={handleClick}
			menu={<GenericMenu title={t('Options')} items={items} />}
		/>
	);
};

export default CallHistoryRowInternalUser;
