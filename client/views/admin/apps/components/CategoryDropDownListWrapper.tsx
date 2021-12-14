import { Box } from '@rocket.chat/fuselage';
import { usePosition } from '@rocket.chat/fuselage-hooks';
import React, { forwardRef, ComponentProps, useRef } from 'react';

import { useOutsideClick } from '../../../../hooks/useOutsideClick';

const options = {
	margin: 8,
	placement: 'bottom-end',
} as const;

const hidden = {
	visibility: 'hidden',
	opacity: 0,
	position: 'fixed',
} as const;

const CategoryDropDownListWrapper = forwardRef<
	Element,
	ComponentProps<typeof Box> & { onClose: (e: unknown) => void }
>(function CategoryDropDownListWrapper({ children, onClose }, ref) {
	const target = useRef<HTMLDivElement>(null);
	useOutsideClick(target, onClose);
	const { style = hidden } = usePosition(ref as Parameters<typeof usePosition>[0], target, options);
	return (
		<Box ref={target} style={style} minWidth={224}>
			{children}
		</Box>
	);
});

export default CategoryDropDownListWrapper;
