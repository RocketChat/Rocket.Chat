import { Tile } from '@rocket.chat/fuselage';
import { usePosition } from '@rocket.chat/fuselage-hooks';
import React, { forwardRef, RefObject, useEffect } from 'react';

export const ToolboxDropdownDesktop = forwardRef<
	HTMLElement,
	{
		onClose: () => void;
		reference: RefObject<HTMLDivElement>;
	}
>(({ onClose, reference, children }, ref) => {
	const { style: s } = usePosition(reference, ref, {
		watch: true,
		placement: 'bottom-start',
	});

	useEffect(() => onClose, [onClose]);

	return (
		<Tile
			is='ul'
			padding={0}
			paddingBlock={'x12'}
			paddingInline={0}
			elevation='2'
			ref={ref}
			style={s}
		>
			{children}
		</Tile>
	);
});
