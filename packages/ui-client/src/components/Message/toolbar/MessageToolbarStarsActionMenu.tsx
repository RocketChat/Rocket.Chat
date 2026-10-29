import { isE2EEMessage } from '@rocket.chat/core-typings';
import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import GenericMenu from '../../GenericMenu/GenericMenu';
import type { GenericMenuItemProps } from '../../GenericMenu/GenericMenuItem';
import type { MessageActionContext } from '../contexts/MessageAction';
import { useMessageToolbar } from '../contexts/MessageToolbarContext';

type MessageActionSection = {
	id: string;
	title: string;
	items: GenericMenuItemProps[];
};

export type MessageToolbarStarsActionMenuProps = {
	message: IMessage;
	context: MessageActionContext;
	room: IRoom;
	subscription: ISubscription | undefined;
	onChangeMenuVisibility: (visible: boolean) => void;
};

const MessageToolbarStarsActionMenu = ({
	message,
	context,
	room,
	subscription,
	onChangeMenuVisibility,
}: MessageToolbarStarsActionMenuProps) => {
	const aiActions = useMessageToolbar().useAiActions(message, { room, subscription, context });
	const { t } = useTranslation();
	const id = useId();

	if (!aiActions.length) {
		return null;
	}

	const isMessageEncrypted = isE2EEMessage(message);

	const groupOptions = aiActions.reduce((acc, option) => {
		const transformedOption = {
			variant: option.variant,
			id: option.id,
			icon: option.icon,
			content: t(option.label),
			onClick: option.action,
			type: option.type,
			...(option.tooltip && { tooltip: option.tooltip }),
			...(typeof option.disabled === 'boolean' && { disabled: option.disabled }),
		};

		const group = option.type || '';
		let section = acc.find((section: { id: string }) => section.id === group);

		if (!section) {
			section = { id: group, title: '', items: [] };
			acc.push(section);
		}

		section.items.push(transformedOption);

		if (group === 'apps' && isMessageEncrypted) {
			section.items = [
				{
					content: t('Unavailable'),
					id,
					disabled: true,
					gap: false,
					tooltip: t('Action_not_available_encrypted_content', { action: t('Apps') }),
				},
			];
		}

		return acc;
	}, [] as MessageActionSection[]);

	return (
		<GenericMenu
			detached
			icon='stars'
			title={t('AI_Actions')}
			sections={groupOptions}
			placement='bottom-end'
			onOpenChange={onChangeMenuVisibility}
		/>
	);
};

export default MessageToolbarStarsActionMenu;
