import { useTranslation } from '@rocket.chat/ui-contexts';
import type { MouseEvent, MouseEventHandler, ReactElement } from 'react';
import React from 'react';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
// import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';
import GenericMenu from '../../GenericMenu/GenericMenu';
// import ToolbarDropdown from './ToolbarDropdown';

type MessageActionConfigOption = Omit<MessageActionConfig, 'condition' | 'context' | 'order' | 'action'> & {
	action: ((event: MouseEvent<HTMLElement, MouseEvent>) => void) & MouseEventHandler<HTMLElement>;
};

// const getSectionOrder = (section: string): number => {
// 	switch (section) {
// 		case 'communication':
// 			return 0;
// 		case 'interaction':
// 			return 1;
// 		case 'duplication':
// 			return 2;
// 		case 'apps':
// 			return 3;
// 		case 'management':
// 			return 4;
// 		default:
// 			return 5;
// 	}
// };

const MessageActionMenu = ({ options }: { options: MessageActionConfigOption[] }): ReactElement => {
	// const buttonRef = useRef<HTMLButtonElement | null>(null);
	const t = useTranslation();
	// const [visible, setVisible] = useState(false);
	// const isLayoutEmbedded = useEmbeddedLayout();

	// const handleChangeMenuVisibility = useCallback(
	// 	(visible: boolean): void => {
	// 		setVisible(visible);
	// 		onChangeMenuVisibility(visible);
	// 	},
	// 	[onChangeMenuVisibility],
	// );

	// const groupOptions = options.reduce((acc, option) => {
	// 	const { type = '' } = option;

	// 	if (option.color === 'alert') {
	// 		option.variant = 'danger' as const;
	// 	}

	// 	const order = getSectionOrder(type);

	// 	const [sectionType, options] = acc[getSectionOrder(type)] ?? [type, []];

	// 	if (!(isLayoutEmbedded && option.id === 'reply-directly')) {
	// 		options.push(option);
	// 	}

	// 	if (options.length === 0) {
	// 		return acc;
	// 	}

	// 	acc[order] = [sectionType, options];

	// 	return acc;
	// }, [] as unknown as [section: string, options: Array<MessageActionConfigOption>][]);

	const groupOptions = options
		.map((option) => ({
			variant: option.color === 'alert' && 'danger',
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
		<GenericMenu
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
