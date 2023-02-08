import { Tile } from '@rocket.chat/fuselage';
import type { ReactNode, Ref } from 'react';
import React, { forwardRef } from 'react';

import ScrollableContentWrapper from '../../../../../components/ScrollableContentWrapper';

type MobileToolboxDropdownProps = {
	children: ReactNode;
	reference: RefObject<HTMLElement>;
};

const MobileToolboxDropdown = forwardRef(function MobileToolboxDropdown(
	{ reference, children }: MobileToolboxDropdownProps,
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
			reference={reference}
		>
			<ScrollableContentWrapper autoHide={false}>{children}</ScrollableContentWrapper>
		</Tile>
	);
});

export default MobileToolboxDropdown;
