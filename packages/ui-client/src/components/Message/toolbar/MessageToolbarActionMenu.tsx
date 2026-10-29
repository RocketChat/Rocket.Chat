import { isE2EEMessage } from '@rocket.chat/core-typings';
import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useLayoutHiddenActions } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import GenericMenu from '../../GenericMenu/GenericMenu';
import type { GenericMenuItemProps } from '../../GenericMenu/GenericMenuItem';
import type { MessageActionConfig, MessageActionContext } from '../contexts/MessageAction';
import { useMessageToolbar } from '../contexts/MessageToolbarContext';

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

const isAppAction = (action: MessageActionConfig) => action.type === 'apps';

const MessageToolbarActionMenu = ({ message, context, room, subscription, onChangeMenuVisibility }: MessageToolbarActionMenuProps) => {
	const actions = useMessageToolbar().useMenuActions(message, { room, subscription, context });
	const hiddenActions = useLayoutHiddenActions().messageToolbox;

	const id = useId();
	const { t } = useTranslation();

	const visibleActions = actions
		.filter((action) => action.group === 'menu')
		.filter((action) => !action.context || action.context.includes(context))
		.filter((action) => !hiddenActions.includes(action.id));

	// App actions keep the order they arrive in and always form the last section.
	const data = [
		...visibleActions.filter((action) => !isAppAction(action)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
		...visibleActions.filter(isAppAction),
	];

	if (data.length === 0) {
		return null;
	}

	const isMessageEncrypted = isE2EEMessage(message);

	const groupOptions = data
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
