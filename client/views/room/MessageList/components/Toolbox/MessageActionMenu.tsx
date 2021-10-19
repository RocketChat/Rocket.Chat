import { css } from '@rocket.chat/css-in-js';
import { MessageToolbox, Box, Option, Tile } from '@rocket.chat/fuselage';
import { usePosition } from '@rocket.chat/fuselage-hooks';
import React, { FC, useState, useEffect, Fragment } from 'react';

import { MessageActionConfig } from '../../../../../../app/ui-utils/client/lib/MessageAction';
import { useTranslation, TranslationKey } from '../../../../../contexts/TranslationContext';

type Option = {
	id: string;
	label: TranslationKey;
	icon?: string;
	// group?: string;
	color?: string; // @deprecated
	variant?: 'danger' | 'success' | 'warning';
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

const style = css`
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
`;

export const MessageActionMenu: FC<{
	// options: {
	// 	[key: string]: Option;
	// };
	options: MessageActionConfig[];
}> = ({ options }) => {
	const ref = React.useRef<HTMLDivElement>(null);

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
		<MessageToolbox.Item ref={ref} icon='kebab' onClick={() => setVisible(true)}>
			{visible && (
				<Dropdown reference={ref} onClose={() => setVisible(false)}>
					{Object.entries(groupOptions).map(([, options], index, arr) => (
						<Fragment key={index}>
							{options.map((option) => (
								<Option
									{...(option.variant === 'danger' && {
										danger: true,
									})}
									key={option.id}
									id={option.id}
									icon={option.icon}
									label={t(option.label)}
								/>
							))}
							{index !== arr.length - 1 && <Option.Divider />}
						</Fragment>
					))}
				</Dropdown>
			)}
		</MessageToolbox.Item>
	);
};

// eslint-disable-next-line react/no-multi-comp
const Dropdown: FC<{ reference: React.MutableRefObject<HTMLDivElement>; onClose: () => void }> = ({
	onClose,
	reference,
	children,
}) => {
	const target = React.useRef<HTMLButtonElement>(null);
	const { style: s, ...rest } = usePosition(reference, target, {
		watch: true,
		placement: 'bottom-start',
	});

	useEffect(() => onClose, []);

	return (
		<Box onClick={onClose} className={style}>
			<Tile
				is='ul'
				padding={0}
				paddingBlock={'x12'}
				paddingInline={0}
				elevation='2'
				ref={target}
				style={s}
			>
				{children}
			</Tile>
		</Box>
	);
};
