import { Tile } from '@rocket.chat/fuselage';
import { usePosition } from '@rocket.chat/fuselage-hooks';
import React, { forwardRef, ReactNode, RefObject } from 'react';

export const ToolboxDropdownDesktop = forwardRef<
	HTMLElement,
	{
		reference: RefObject<HTMLElement>;
		children: ReactNode;
	}
>(function ToolboxDropdownDesktop({ reference, children, ...rest }, ref) {
	const { style: s } = usePosition(reference, ref as RefObject<HTMLElement>, {
		watch: true,
		placement: 'bottom-end',
	});

	return (
		<Tile is='ul' padding={0} paddingBlock={'x12'} paddingInline={0} elevation='2' ref={ref} style={s} {...rest}>
			{children}
		</Tile>
	);
});
