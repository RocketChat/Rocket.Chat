import { Tile } from '@rocket.chat/fuselage';
import type { ReactNode, Ref } from 'react';
import React, { forwardRef } from 'react';

import ScrollableContentWrapper from '../../ScrollableContentWrapper';

type MobileToolbarDropdownProps = {
	children: ReactNode;
};

const MobileToolbarDropdown = forwardRef(function MobileToolbarDropdown(
	{ children, ...props }: MobileToolbarDropdownProps,
	ref: Ref<HTMLElement>,
) {
	return (
		<Tile
			ref={ref}
			position='fixed'
			is='ul'
			padding={0}
			paddingBlock={12}
			paddingInline={0}
			elevation='2'
			marginInline={12}
			zIndex={9999}
			maxHeight='50%'
			insetBlockEnd={0}
			insetInline={0}
			opacity={1}
			height='full'
			{...props}
		>
			<ScrollableContentWrapper autoHide={false}>{children}</ScrollableContentWrapper>
		</Tile>
	);
});

export default MobileToolbarDropdown;
