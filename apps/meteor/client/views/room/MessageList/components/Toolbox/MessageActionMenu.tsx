import { MessageToolboxItem, Option } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useState, Fragment, useRef, ComponentProps } from 'react';

import { MessageActionConfig } from '../../../../../../app/ui-utils/client/lib/MessageAction';
import { ToolboxDropdown } from './ToolboxDropdown';

type MessageActionConfigOption = Omit<MessageActionConfig, 'condition' | 'context' | 'order'>;

export const MessageActionMenu: FC<{
	options: MessageActionConfig[];
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

	return (
		<MessageToolboxItem
			ref={ref}
			icon='kebab'
			onClick={(): void => setVisible(!visible)}
			data-qa-id='menu'
			data-qa-type='message-action-menu'
		>
			{visible && (
				<ToolboxDropdown reference={ref} {...rest}>
					{Object.entries(groupOptions).map(([, options], index, arr) => (
						<Fragment key={index}>
							{options.map((option) => (
								<Option
									variant={option.variant}
									key={option.id}
									id={option.id}
									icon={option.icon as ComponentProps<typeof Option>['icon']}
									label={t(option.label)}
									onClick={option.action as any}
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
