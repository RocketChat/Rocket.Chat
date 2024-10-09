import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { GenericMenu, type GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { MouseEvent, ReactElement } from 'react';
import React from 'react';

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

const MessageActionMenu = ({ options, onChangeMenuVisibility, context, isMessageEncrypted }: MessageActionMenuProps): ReactElement => {
	const t = useTranslation();
	const id = useUniqueId();
	const groupOptions = options
		.map((option) => ({
			variant: option.color === 'alert' ? 'danger' : '',
			id: option.id,
			icon: option.icon,
			content: t(option.label),
			onClick: option.action,
			type: option.type,
			...(option.disabled && { disabled: option?.disabled?.(context) }),
			...(option.disabled &&
				option?.disabled?.(context) && { tooltip: t('Action_not_available_encrypted_content', { action: t(option.label) }) }),
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
		}, [] as unknown as MessageActionSection[])
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
			data-qa-type='message-action-menu'
			sections={groupOptions}
			placement='bottom-end'
		/>
	);
};

export default MessageActionMenu;
