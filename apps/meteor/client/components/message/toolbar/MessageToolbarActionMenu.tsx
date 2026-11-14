import { isE2EEMessage, type IMessage, type IRoom, type ISubscription } from '@rocket.chat/core-typings';
import { isTruthy } from '@rocket.chat/tools';
import { GenericMenu, type GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useLayoutHiddenActions } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { MessageActionContext } from '../../../lib/MessageAction';
import { useCopyAction } from '../../../providers/MessagesProvider/actions/useCopyAction';
import { useDeleteMessageAction } from '../../../providers/MessagesProvider/actions/useDeleteMessageAction';
import { useEditMessageAction } from '../../../providers/MessagesProvider/actions/useEditMessageAction';
import { useFollowMessageAction } from '../../../providers/MessagesProvider/actions/useFollowMessageAction';
import { useMarkAsUnreadMessageAction } from '../../../providers/MessagesProvider/actions/useMarkAsUnreadMessageAction';
import { useMessageActionAppsActionButtons } from '../../../providers/MessagesProvider/actions/useMessageActionAppsActionButtons';
import { useNewDiscussionMessageAction } from '../../../providers/MessagesProvider/actions/useNewDiscussionMessageAction';
import { usePermalinkAction } from '../../../providers/MessagesProvider/actions/usePermalinkAction';
import { usePinMessageAction } from '../../../providers/MessagesProvider/actions/usePinMessageAction';
import { useReadReceiptsDetailsAction } from '../../../providers/MessagesProvider/actions/useReadReceiptsDetailsAction';
import { useReplyInDMAction } from '../../../providers/MessagesProvider/actions/useReplyInDMAction';
import { useReportMessageAction } from '../../../providers/MessagesProvider/actions/useReportMessageAction';
import { useShowMessageReactionsAction } from '../../../providers/MessagesProvider/actions/useShowMessageReactionsAction';
import { useStarMessageAction } from '../../../providers/MessagesProvider/actions/useStarMessageAction';
import { useTranslateAction } from '../../../providers/MessagesProvider/actions/useTranslateAction';
import { useUnFollowMessageAction } from '../../../providers/MessagesProvider/actions/useUnFollowMessageAction';
import { useUnpinMessageAction } from '../../../providers/MessagesProvider/actions/useUnpinMessageAction';
import { useUnstarMessageAction } from '../../../providers/MessagesProvider/actions/useUnstarMessageAction';
import { useViewOriginalTranslationAction } from '../../../providers/MessagesProvider/actions/useViewOriginalTranslationAction';

type MessageActionSection = {
	id: string;
	title: string;
	items: GenericMenuItemProps[];
};

export type MessageToolbarActionMenuProps = {
	message: IMessage;
	context: MessageActionContext;
	room: IRoom;
	subscription: ISubscription | undefined;
	onChangeMenuVisibility: (visible: boolean) => void;
};

const MessageToolbarActionMenu = ({ message, context, room, subscription, onChangeMenuVisibility }: MessageToolbarActionMenuProps) => {
	// TODO: move this to another place
	const menuItems = [
		useNewDiscussionMessageAction(message, { room, subscription }),
		useUnpinMessageAction(message, { room, subscription }),
		usePinMessageAction(message, { room, subscription }),
		useStarMessageAction(message, { room }),
		useUnstarMessageAction(message, { room }),
		usePermalinkAction(message, { id: 'permalink-star', context: ['starred'], order: 10 }, { room }),
		usePermalinkAction(message, { id: 'permalink-pinned', context: ['pinned'], order: 5 }, { room }),
		usePermalinkAction(
			message,
			{
				id: 'permalink',
				context: ['message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
				type: 'duplication',
				order: 5,
			},
			{ room },
		),
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
			variant: option.variant,
			id: option.id,
			icon: option.icon,
			content: t(option.label),
			onClick: option.action,
			type: option.type,
			...(option.tooltip && { tooltip: option.tooltip }),
			...(typeof option.disabled === 'boolean' && { disabled: option.disabled }),
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

	return <GenericMenu onOpenChange={onChangeMenuVisibility} detached title={t('More')} sections={groupOptions} placement='bottom-end' />;
};

export default MessageToolbarActionMenu;
