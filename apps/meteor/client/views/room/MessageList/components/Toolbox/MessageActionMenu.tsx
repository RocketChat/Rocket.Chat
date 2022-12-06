import { MessageToolboxItem, Option } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC, ComponentProps, UIEvent } from 'react';
import React, { useState, Fragment, useRef } from 'react';

import type { MessageActionConfig } from '../../../../../../app/ui-utils/client/lib/MessageAction';
import { ToolboxDropdown } from './ToolboxDropdown';

type MessageActionConfigOption = Omit<MessageActionConfig, 'condition' | 'context' | 'order' | 'action'> & {
	action: (event: UIEvent) => void;
};

export const MessageActionMenu: FC<{
	options: MessageActionConfigOption[];
}> = ({ options, ...rest }) => {
	const ref = useRef(null);

	const t = useTranslation();
	const [visible, setVisible] = useState(false);

	const groupOptions = options
		.map(({ color, ...option }) => ({
			...option,
			...(color === 'alert' && { variant: 'danger' as const }),
		}))
		.reduce((acc, option) => {
			const group = option.variant ? option.variant : '';
			acc[group] = acc[group] || [];
			acc[group].push(option);
			return acc;
		}, {} as { [key: string]: MessageActionConfigOption[] }) as {
		[key: string]: MessageActionConfigOption[];
	};

	const messagesContainer = document.querySelector('.messages-container') || document.body;

	return (
		<MessageToolboxItem
			ref={ref}
			icon='kebab'
			onClick={(): void => setVisible(!visible)}
			data-qa-id='menu'
			data-qa-type='message-action-menu'
			title={t('More')}
		>
			{visible && (
				<ToolboxDropdown reference={ref} container={messagesContainer} {...rest}>
					{Object.entries(groupOptions).map(([, options], index, arr) => (
						<Fragment key={index}>
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
								/>
							))}
							{index !== arr.length - 1 && <Option.Divider />}
						</Fragment>
					))}
				</ToolboxDropdown>
			)}
		</MessageToolboxItem>
	);
};
