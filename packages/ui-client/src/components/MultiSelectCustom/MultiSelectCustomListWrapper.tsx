import { Box } from '@rocket.chat/fuselage';
import { useOutsideClick } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { forwardRef, useRef } from 'react';

const MultiSelectCustomListWrapper = forwardRef<Element, ComponentProps<typeof Box> & { onClose: (e: MouseEvent) => void }>(
	function MultiSelectCustomListWrapper({ children, onClose }) {
		const target = useRef<HTMLElement>(null);
		useOutsideClick([target], onClose);

		return (
			<Box ref={target} zIndex='99999' w='full' position='absolute' mbs='x40' pbs='x4'>
				{children}
			</Box>
		);
	},
);

export default MultiSelectCustomListWrapper;
