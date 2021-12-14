import { Box } from '@rocket.chat/fuselage';
import { PositionOptions, usePosition } from '@rocket.chat/fuselage-hooks';
import React, { forwardRef, ComponentProps, useRef } from 'react';

const options = {
	margin: 8,
	placement: 'bottom-end',
} as PositionOptions;

const hidden = {
	visibility: 'hidden',
	opacity: 0,
	position: 'fixed',
} as const;

const CategoryDropDownListWrapper = forwardRef<Element, ComponentProps<typeof Box>>(
	function CategoryDropDownListWrapper({ children }, ref) {
		const target = useRef<HTMLDivElement>(null);
		const { style = hidden } = usePosition(
			ref as Parameters<typeof usePosition>[0],
			target,
			options,
		);
		return (
			<Box ref={target} style={style} minWidth={224}>
				{children}
			</Box>
		);
	},
);

export default CategoryDropDownListWrapper;
