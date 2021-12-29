import { Tile } from '@rocket.chat/fuselage';
import { usePosition } from '@rocket.chat/fuselage-hooks';
import React, { forwardRef, ReactNode, RefObject, useEffect } from 'react';

export const ToolboxDropdownDesktop = forwardRef<
	HTMLElement,
	{
		onClose: () => void;
		reference: RefObject<HTMLElement>;
		children: ReactNode;
	}
>(({ onClose, reference, children }, ref) => {
	const { style: s } = usePosition(reference, ref as RefObject<HTMLElement>, {
		watch: true,
		placement: 'bottom-start',
	});

	useEffect(() => onClose, [onClose]);

	return (
		<Tile is='ul' padding={0} paddingBlock={'x12'} paddingInline={0} elevation='2' ref={ref} style={s}>
			{children}
		</Tile>
	);
});
