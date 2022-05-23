import { Tile } from '@rocket.chat/fuselage';
import React, { forwardRef, ReactNode } from 'react';

import ScrollableContentWrapper from '../../../../../components/ScrollableContentWrapper';

const dropdownStyle = {
	bottom: 0,
	left: 0,
	right: 0,
};

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
			mi='x12'
			zIndex={9999}
			ref={ref}
			style={dropdownStyle}
			maxHeight='50%'
			opacity={1}
			h='full'
			{...rest}
		>
			<ScrollableContentWrapper autoHide={false}>{children}</ScrollableContentWrapper>
		</Tile>
	);
});
