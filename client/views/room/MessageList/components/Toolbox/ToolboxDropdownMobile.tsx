import { css } from '@rocket.chat/css-in-js';
import { Tile } from '@rocket.chat/fuselage';
import React, { forwardRef, ReactNode } from 'react';

import ScrollableContentWrapper from '../../../../../components/ScrollableContentWrapper';

const dropdownStyle = css`
	z-index: 9999;
	opacity: 1;
	bottom: 0;
	left: 0;
	right: 0;
`;

export const ToolboxDropdownMobile = forwardRef<
	HTMLElement,
	{
		children: ReactNode;
	}
>(function ToolboxDropdownMobile({ children, ...rest }, ref) {
	return (
		<Tile
			position='fixed'
			is='ul'
			padding={0}
			paddingBlock='x12'
			paddingInline={0}
			elevation='2'
			ref={ref}
			className={dropdownStyle}
			maxHeight='50%'
			h='full'
			{...rest}
		>
			<ScrollableContentWrapper autoHide={false}>{children}</ScrollableContentWrapper>
		</Tile>
	);
});
