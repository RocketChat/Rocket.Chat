import { MessageToolboxItem, Option, OptionDivider, OptionTitle } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEvent, MouseEventHandler, ReactElement } from 'react';
import React, { Fragment, useCallback, useRef, useState } from 'react';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';
import ToolboxDropdown from './ToolboxDropdown';

type MessageActionConfigOption = Omit<MessageActionConfig, 'condition' | 'context' | 'order' | 'action'> & {
	action: ((event: MouseEvent<HTMLElement, MouseEvent>) => void) & MouseEventHandler<HTMLElement>;
};

type MessageActionMenuProps = {
	onChangeMenuVisibility: (visible: boolean) => void;
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

const MessageActionMenu = ({ options, onChangeMenuVisibility, ...props }: MessageActionMenuProps): ReactElement => {
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const t = useTranslation();
	const [visible, setVisible] = useState(false);
	const isLayoutEmbedded = useEmbeddedLayout();

	const handleChangeMenuVisibility = useCallback(
		(visible: boolean): void => {
			setVisible(visible);
			onChangeMenuVisibility(visible);
		},
		[onChangeMenuVisibility],
	);

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

	const handleClose = useCallback(() => {
		handleChangeMenuVisibility(false);
	}, [handleChangeMenuVisibility]);
	return (
		<>
			<MessageToolboxItem
				ref={buttonRef}
				icon='kebab'
				onClick={(): void => handleChangeMenuVisibility(!visible)}
				data-qa-id='menu'
				data-qa-type='message-action-menu'
				title={t('More')}
			/>
			{visible && (
				<>
					<ToolboxDropdown handleClose={handleClose} reference={buttonRef} {...props}>
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
										gap={!option.icon && option.type === 'apps'}
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
