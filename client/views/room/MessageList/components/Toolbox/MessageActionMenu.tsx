import { MessageToolbox, Option } from '@rocket.chat/fuselage';
import React, { FC, useState, Fragment, useRef } from 'react';

import { MessageActionConfig } from '../../../../../../app/ui-utils/client/lib/MessageAction';
import { useTranslation, TranslationKey } from '../../../../../contexts/TranslationContext';
import { ToolboxDropdown } from './ToolboxDropdown';

type Option = {
	id: string;
	label: TranslationKey;
	icon?: string;
	// group?: string;
	color?: string; // @deprecated
	variant?: 'danger' | 'success' | 'warning';
	action: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export const MessageActionMenu: FC<{
	// options: {
	// 	[key: string]: Option;
	// };
	options: MessageActionConfig[];
}> = ({ options }) => {
	const ref = useRef<HTMLElement>(null);

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
		}, {} as { [key: string]: Option[] });

	return (
		<MessageToolbox.Item ref={ref} icon='kebab' onClick={(): void => setVisible(true)}>
			{visible && (
				<ToolboxDropdown
					reference={ref}
					onClose={(e): void => {
						e.stopPropagation();
						setVisible(false);
					}}
				>
					{Object.entries(groupOptions).map(([, options], index, arr) => (
						<Fragment key={index}>
							{options.map((option) => (
								<Option
									variant={option.variant}
									key={option.id}
									id={option.id}
									icon={option.icon}
									label={t(option.label)}
									onClick={option.action}
								/>
							))}
							{index !== arr.length - 1 && <Option.Divider />}
						</Fragment>
					))}
				</ToolboxDropdown>
			)}
		</MessageToolbox.Item>
	);
};
