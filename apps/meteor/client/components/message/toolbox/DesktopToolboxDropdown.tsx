import { Tile, PositionAnimated } from '@rocket.chat/fuselage';
import type { ReactNode, Ref, RefObject } from 'react';
import React, { forwardRef } from 'react';

type DesktopToolboxDropdownProps = {
	children: ReactNode;
	reference: RefObject<HTMLElement>;
};

const DesktopToolboxDropdown = forwardRef(function ToolboxDropdownDesktop(
	{ reference, children }: DesktopToolboxDropdownProps,
	ref: Ref<HTMLElement>,
) {
	return (
		<PositionAnimated anchor={reference} placement='bottom-end' visible='visible'>
			<Tile is='ul' padding={0} paddingBlock={12} paddingInline={0} elevation='2' ref={ref}>
				{children}
			</Tile>
		</PositionAnimated>
	);
});

export default DesktopToolboxDropdown;
