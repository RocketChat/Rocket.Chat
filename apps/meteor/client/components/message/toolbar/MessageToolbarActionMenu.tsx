import { isE2EEMessage, type IMessage, type IRoom, type ISubscription } from '@rocket.chat/core-typings';
import { GenericMenu, type GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useLayoutHiddenActions } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useCopyAction } from './useCopyAction';
import { useDeleteMessageAction } from './useDeleteMessageAction';
import { useEditMessageAction } from './useEditMessageAction';
import { useFollowMessageAction } from './useFollowMessageAction';
import { useMarkAsUnreadMessageAction } from './useMarkAsUnreadMessageAction';
import { useMessageActionAppsActionButtons } from './useMessageActionAppsActionButtons';
import { useNewDiscussionMessageAction } from './useNewDiscussionMessageAction';
import { usePermalinkAction } from './usePermalinkAction';
import { usePinMessageAction } from './usePinMessageAction';
import { useReadReceiptsDetailsAction } from './useReadReceiptsDetailsAction';
import { useReplyInDMAction } from './useReplyInDMAction';
import { useReportMessageAction } from './useReportMessageAction';
import { useShowMessageReactionsAction } from './useShowMessageReactionsAction';
import { useStarMessageAction } from './useStarMessageAction';
import { useTranslateAction } from './useTranslateAction';
import { useUnFollowMessageAction } from './useUnFollowMessageAction';
import { useUnpinMessageAction } from './useUnpinMessageAction';
import { useUnstarMessageAction } from './useUnstarMessageAction';
import { useViewOriginalTranslationAction } from './useViewOriginalTranslationAction';
import { useWebDAVMessageAction } from './useWebDAVMessageAction';
import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { isTruthy } from '../../../../lib/isTruthy';

type MessageActionSection = {
	id: string;
	title: string;
	items: GenericMenuItemProps[];
};

type MessageToolbarActionMenuProps = {
	message: IMessage;
	context: MessageActionContext;
	room: IRoom;
	subscription: ISubscription | undefined;
	onChangeMenuVisibility: (visible: boolean) => void;
};

const MessageToolbarActionMenu = ({ message, context, room, subscription, onChangeMenuVisibility }: MessageToolbarActionMenuProps) => {
	// TODO: move this to another place
	const menuItems = [
		useWebDAVMessageAction(message, { subscription }),
		useNewDiscussionMessageAction(message, { room, subscription }),
		useUnpinMessageAction(message, { room, subscription }),
		usePinMessageAction(message, { room, subscription }),
		useStarMessageAction(message, { room }),
		useUnstarMessageAction(message, { room }),
		usePermalinkAction(message, { id: 'permalink-star', context: ['starred'], order: 10 }),
		usePermalinkAction(message, { id: 'permalink-pinned', context: ['pinned'], order: 5 }),
		usePermalinkAction(message, {
			id: 'permalink',
			context: ['message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
			type: 'duplication',
			order: 5,
		}),
		useFollowMessageAction(message, { room, context }),
		useUnFollowMessageAction(message, { room, context }),
		useMarkAsUnreadMessageAction(message, { room, subscription }),
		useTranslateAction(message, { room, subscription }),
		useViewOriginalTranslationAction(message, { room, subscription }),
		useReplyInDMAction(message, { room, subscription }),
		useCopyAction(message, { subscription }),
		useEditMessageAction(message, { room, subscription }),
		useDeleteMessageAction(message, { room, subscription }),
		useReportMessageAction(message, { room, subscription }),
		useShowMessageReactionsAction(message),
		useReadReceiptsDetailsAction(message),
	];

	const hiddenActions = useLayoutHiddenActions().messageToolbox;
	const data = menuItems
		.filter(isTruthy)
		.filter((button) => button.group === 'menu')
		.filter((button) => !button.context || button.context.includes(context))
		.filter((action) => !hiddenActions.includes(action.id))
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	const actionButtonApps = useMessageActionAppsActionButtons(message, context);

	const id = useId();
	const { t } = useTranslation();

	if (data.length === 0) {
		return null;
	}

	const isMessageEncrypted = isE2EEMessage(message);

	const groupOptions = [...data, ...(actionButtonApps.data ?? [])]
		.map((option) => ({
			variant: option.color === 'alert' ? 'danger' : '',
			id: option.id,
			icon: option.icon,
			content: t(option.label),
			onClick: option.action,
			type: option.type,
			...(typeof option.disabled === 'boolean' && { disabled: option.disabled }),
			...(typeof option.disabled === 'boolean' &&
				option.disabled && { tooltip: t('Action_not_available_encrypted_content', { action: t(option.label) }) }),
		}))
		.reduce((acc, option) => {
			const group = option.type ? option.type : '';
			const section = acc.find((section: { id: string }) => section.id === group);
			if (section) {
				section.items.push(option);
				return acc;
			}
			const newSection = { id: group, title: group === 'apps' ? t('Apps') : '', items: [option] };
			acc.push(newSection);

			return acc;
		}, [] as MessageActionSection[])
		.map((section) => {
			if (section.id !== 'apps') {
				return section;
			}

			if (!isMessageEncrypted) {
				return section;
			}

			return {
				id: 'apps',
				title: t('Apps'),
				items: [
					{
						content: t('Unavailable'),
						type: 'apps',
						id,
						disabled: true,
						gap: false,
						tooltip: t('Action_not_available_encrypted_content', { action: t('Apps') }),
					},
				],
			};
		});

	return (
		<GenericMenu
			onOpenChange={onChangeMenuVisibility}
			detached
			title={t('More')}
			data-qa-id='menu'
			data-qa-type='message-action-menu-options'
			sections={groupOptions}
			placement='bottom-end'
		/>
	);
};

export default MessageToolbarActionMenu;
