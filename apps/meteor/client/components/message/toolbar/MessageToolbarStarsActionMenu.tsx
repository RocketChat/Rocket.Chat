import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { GenericMenu, type GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { MouseEvent, ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { MessageActionConditionProps, MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';

type MessageActionConfigOption = Omit<MessageActionConfig, 'condition' | 'context' | 'order' | 'action'> & {
	action: (e?: MouseEvent<HTMLElement>) => void;
};

type MessageActionSection = {
	id: string;
	title: string;
	items: GenericMenuItemProps[];
};

type MessageActionMenuProps = {
	onChangeMenuVisibility: (visible: boolean) => void;
	options: MessageActionConfigOption[];
	context: MessageActionConditionProps;
	isMessageEncrypted: boolean;
};

const MessageToolbarStarsActionMenu = ({
	options,
	onChangeMenuVisibility,
	context,
	isMessageEncrypted,
}: MessageActionMenuProps): ReactElement => {
	const { t } = useTranslation();
	const id = useUniqueId();

	const groupOptions = options.reduce((acc, option) => {
		const transformedOption = {
			variant: option.color === 'alert' ? 'danger' : '',
			id: option.id,
			icon: option.icon,
			content: t(option.label),
			onClick: option.action,
			type: option.type,
			...(option.disabled && { disabled: option?.disabled?.(context) }),
			...(option.disabled &&
				option?.disabled?.(context) && { tooltip: t('Action_not_available_encrypted_content', { action: t(option.label) }) }),
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
			onOpenChange={onChangeMenuVisibility}
			detached
			icon='stars'
			title={t('AI_Actions')}
			data-qa-id='menu'
			data-qa-type='message-action-menu'
			sections={groupOptions}
			placement='bottom-end'
		/>
	);
};

export default MessageToolbarStarsActionMenu;
