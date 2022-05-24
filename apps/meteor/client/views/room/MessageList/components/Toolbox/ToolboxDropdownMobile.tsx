import { Tile } from '@rocket.chat/fuselage';
import React, { forwardRef, ReactNode } from 'react';

import ScrollableContentWrapper from '../../../../../components/ScrollableContentWrapper';

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
			maxHeight='50%'
			insetBlockEnd={0}
			insetInline={0}
			opacity={1}
			h='full'
			{...rest}
		>
			<ScrollableContentWrapper autoHide={false}>{children}</ScrollableContentWrapper>
		</Tile>
	);
});
