import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type colors from '@rocket.chat/fuselage-tokens/colors';
import React, { memo, ReactElement, ReactNode } from 'react';

type GenericItemProps = {
	href: string;
	active?: boolean;
	children: ReactNode;
	customColors?: {
		default: typeof colors[string];
		hover: typeof colors[string];
		active: typeof colors[string];
	};
	textColor?: string;
};

const GenericItem = ({ href, active, children, customColors, textColor = 'default', ...props }: GenericItemProps): ReactElement => (
	<Box
		is='a'
		color={textColor}
		pb='x8'
		pi='x24'
		href={href}
		className={[
			active && 'active',
			css`
				${customColors ? `background-color: ${customColors.default} !important;` : ''}
				&:hover,
				&:focus,
				
				&.active:hover {
					background-color: ${customColors?.hover || 'var(--sidebar-background-light-hover)'} !important;
				}

				&.active {
					background-color: ${customColors?.active || 'var(--sidebar-background-light-active)'} !important;
				}
			`,
		].filter(Boolean)}
		{...props}
	>
		<Box mi='neg-x4' display='flex' flexDirection='row' alignItems='center'>
			{children}
		</Box>
	</Box>
);

export default memo(GenericItem);
