import { Box } from '@rocket.chat/fuselage';
import { useOutsideClick, usePosition } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { forwardRef, useRef } from 'react';

const options = {
	margin: 8,
	placement: 'bottom-end',
} as const;

const hidden = {
	visibility: 'hidden',
	opacity: 0,
	position: 'fixed',
} as const;

const MultiSelectCustomListWrapper = forwardRef<Element, ComponentProps<typeof Box> & { onClose: (e: MouseEvent) => void }>(
	function MultiSelectCustomListWrapper({ children, onClose }, ref) {
		const target = useRef<HTMLElement>(null);
		useOutsideClick([target], onClose);
		const { style = hidden } = usePosition(ref as Parameters<typeof usePosition>[0], target, options);
		return (
			<Box ref={target} style={style} minWidth='x224' zIndex='99999'>
				{children}
			</Box>
		);
	},
);

export default MultiSelectCustomListWrapper;
