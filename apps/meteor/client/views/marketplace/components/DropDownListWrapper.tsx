import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import { usePosition, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import type { RefAttributes } from 'react';
import { useRef } from 'react';

const options = {
	margin: 8,
	placement: 'bottom-end',
} as const;

const hidden = {
	visibility: 'hidden',
	opacity: 0,
	position: 'fixed',
} as const;

export type DropDownListWrapperProps = BoxProps & { onClose: (e: MouseEvent) => void } & RefAttributes<Element>;

const DropDownListWrapper = ({ children, onClose, ref }: DropDownListWrapperProps) => {
	const target = useRef<HTMLElement>(null);
	useOutsideClick([target], onClose);
	const { style = hidden } = usePosition(ref as Parameters<typeof usePosition>[0], target, options);
	return (
		<Box ref={target} style={style} minWidth={224} zIndex='99999'>
			{children}
		</Box>
	);
};

export default DropDownListWrapper;
