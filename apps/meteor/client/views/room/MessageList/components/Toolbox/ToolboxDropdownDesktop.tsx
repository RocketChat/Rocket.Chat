import { Tile } from '@rocket.chat/fuselage';
import { usePosition } from '@rocket.chat/fuselage-hooks';
import type { ReactNode, RefObject } from 'react';
import React, { forwardRef } from 'react';

export const ToolboxDropdownDesktop = forwardRef<
	HTMLElement,
	{
		reference: RefObject<HTMLElement>;
		children: ReactNode;
		container: Element;
	}
>(function ToolboxDropdownDesktop({ reference, container, children, ...rest }, ref) {
	const { style: s } = usePosition(reference, ref as RefObject<HTMLElement>, {
		watch: true,
		placement: 'bottom-end',
		container,
	});

	return (
		<Tile is='ul' padding={0} paddingBlock={'x12'} paddingInline={0} elevation='2' ref={ref} style={s} {...rest}>
			{children}
		</Tile>
	);
});
