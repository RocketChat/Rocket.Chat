import { useTranslation } from '@rocket.chat/ui-contexts';
import type { MouseEvent, MouseEventHandler, ReactElement } from 'react';
import React from 'react';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import GenericMenu from '../../GenericMenu/GenericMenu';
import type { GenericMenuItemProps } from '../../GenericMenu/GenericMenuItem';

type MessageActionConfigOption = Omit<MessageActionConfig, 'condition' | 'context' | 'order' | 'action'> & {
	action: ((event: MouseEvent<HTMLElement, MouseEvent>) => void) & MouseEventHandler<HTMLElement>;
};

type MessageActionSection = {
	id: string;
	title: string;
	items: GenericMenuItemProps[];
};

type MessageActionMenuProps = {
	onChangeMenuVisibility: (visible: boolean) => void;
	options: MessageActionConfigOption[];
};

const MessageActionMenu = ({ options, onChangeMenuVisibility }: MessageActionMenuProps): ReactElement => {
	const t = useTranslation();

	const groupOptions = options
		.map((option) => ({
			variant: option.color === 'alert' ? 'danger' : '',
			id: option.id,
			icon: option.icon,
			content: t(option.label),
			onClick: option.action as any,
			type: option.type,
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
		}, [] as unknown as MessageActionSection[]);

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
