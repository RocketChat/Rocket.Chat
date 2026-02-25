import { Box } from '@rocket.chat/fuselage';
import { useOutsideClick } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { forwardRef, useRef } from 'react';

const DropDownListWrapper = forwardRef<Element, ComponentProps<typeof Box> & { onClose: (e: MouseEvent) => void }>(
	function CategoryDropDownListWrapper({ children, onClose }, ref) {
		const target = useRef<HTMLElement>(null);
		useOutsideClick([target], onClose);

		return (
			<Box
				ref={target}
				minWidth={224}
				zIndex='99999'
				style={{
					position: 'absolute',
					top: '100%',
					insetInlineStart: 0,
					marginTop: '4px',
				}}
			>
				{children}
			</Box>
		);
	},
);

export default DropDownListWrapper;