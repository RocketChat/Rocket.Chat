import { isE2EEMessage, type IMessage } from '@rocket.chat/core-typings';
import { GenericMenu, type GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useMessageActionAppsActionButtons } from './useMessageActionAppsActionButtons';
import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';

type MessageActionSection = {
	id: string;
	title: string;
	items: GenericMenuItemProps[];
};

type MessageActionMenuProps = {
	message: IMessage;
	context: MessageActionContext;
	onChangeMenuVisibility: (visible: boolean) => void;
};

const MessageToolbarStarsActionMenu = ({ message, context, onChangeMenuVisibility }: MessageActionMenuProps) => {
	const starsAction = useMessageActionAppsActionButtons(message, context, 'ai');
	const { t } = useTranslation();
	const id = useId();

	if (!starsAction.data?.length) {
		return null;
	}

	const isMessageEncrypted = isE2EEMessage(message);

	const groupOptions = starsAction.data.reduce((acc, option) => {
		const transformedOption = {
			variant: option.color === 'alert' ? 'danger' : '',
			id: option.id,
			icon: option.icon,
			content: t(option.label),
			onClick: option.action,
			type: option.type,
			...(typeof option.disabled === 'boolean' && { disabled: option.disabled }),
			...(typeof option.disabled === 'boolean' &&
				option.disabled && { tooltip: t('Action_not_available_encrypted_content', { action: t(option.label) }) }),
		};

		const group = option.type || '';
		let section = acc.find((section: { id: string }) => section.id === group);

		if (!section) {
			section = { id: group, title: '', items: [] };
			acc.push(section);
		}

		// Add option to the appropriate section
		section.items.push(transformedOption);

		// Handle the "apps" section if message is encrypted
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
			data-qa-id='menu'
			data-qa-type='message-action-stars-menu-options'
			onOpenChange={onChangeMenuVisibility}
		/>
	);
};

export default MessageToolbarStarsActionMenu;
