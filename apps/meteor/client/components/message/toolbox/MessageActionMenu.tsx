import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import GenericMenu from '../../GenericMenu/GenericMenu';

type MessageActionConfigOption = Omit<MessageActionConfig, 'condition' | 'context' | 'order' | 'action'> & {
	action: (event: UIEvent) => void;
};

type MessageActionMenuProps = {
	options: MessageActionConfigOption[];
};

const MessageActionMenu = ({ options }: MessageActionMenuProps): ReactElement => {
	const t = useTranslation();

	const groupOptions = options
		.map((option) => ({
			variant: option.color === 'alert' && ('danger' as const),
			id: option.id,
			icon: option.icon,
			content: t(option.label),
			onClick: option.action,
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
		}, [] as any);

	return (
		<GenericMenu title={t('More')} data-qa-id='menu' data-qa-type='message-action-menu' sections={groupOptions} placement='bottom-end' />
	);
};

export default MessageActionMenu;
