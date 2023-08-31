import { Box, MessageToolboxItem, Option, OptionDivider, OptionTitle } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEvent, MouseEventHandler, ReactElement } from 'react';
import React, { Fragment, useRef, useState } from 'react';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';
import ToolboxDropdown from './ToolboxDropdown';

type MessageActionConfigOption = Omit<MessageActionConfig, 'condition' | 'context' | 'order' | 'action'> & {
	action: ((event: MouseEvent<HTMLElement, MouseEvent>) => void) & MouseEventHandler<HTMLElement>;
};

type MessageActionMenuProps = {
	options: MessageActionConfigOption[];
};

const getSectionOrder = (section: string): number => {
	switch (section) {
		case 'communication':
			return 0;
		case 'interaction':
			return 1;
		case 'duplication':
			return 2;
		case 'apps':
			return 3;
		case 'management':
			return 4;
		default:
			return 5;
	}
};

const MessageActionMenu = ({ options, ...props }: MessageActionMenuProps): ReactElement => {
	const ref = useRef(null);
	const t = useTranslation();
	const [visible, setVisible] = useState(false);
	const isLayoutEmbedded = useEmbeddedLayout();

	const groupOptions = options.reduce((acc, option) => {
		const { type = '' } = option;

		if (option.color === 'alert') {
			option.variant = 'danger' as const;
		}

		const order = getSectionOrder(type);

		const [sectionType, options] = acc[getSectionOrder(type)] ?? [type, []];

		if (!(isLayoutEmbedded && option.id === 'reply-directly')) {
			options.push(option);
		}

		if (options.length === 0) {
			return acc;
		}

		acc[order] = [sectionType, options];

		return acc;
	}, [] as unknown as [section: string, options: Array<MessageActionConfigOption>][]);

	return (
		<>
			<MessageToolboxItem
				ref={ref}
				icon='kebab'
				onClick={(): void => setVisible(!visible)}
				data-qa-id='menu'
				data-qa-type='message-action-menu'
				title={t('More')}
			/>
			{visible && (
				<>
					<Box position='fixed' inset={0} onClick={(): void => setVisible(!visible)} />
					<ToolboxDropdown reference={ref} {...props}>
						{groupOptions.map(([section, options], index, arr) => (
							<Fragment key={index}>
								{section === 'apps' && <OptionTitle>Apps</OptionTitle>}
								{options.map((option) => (
									<Option
										variant={option.variant}
										key={option.id}
										id={option.id}
										icon={option.icon as ComponentProps<typeof Option>['icon']}
										label={t(option.label)}
										onClick={option.action}
										data-qa-type='message-action'
										data-qa-id={option.id}
										role={option.role ? option.role : 'button'}
									/>
								))}
								{index !== arr.length - 1 && <OptionDivider />}
							</Fragment>
						))}
					</ToolboxDropdown>
				</>
			)}
		</>
	);
};

export default MessageActionMenu;
