import type { ReactNode, RefAttributes } from 'react';

import { Box } from '../Box';
import { PopoverSurface } from '../PopoverSurface';

export type DropdownMobileProps = RefAttributes<HTMLElement> & {
	children: ReactNode;
};

export function DropdownMobile({ children, ...props }: DropdownMobileProps) {
	return (
		<PopoverSurface flush maxHeight='most-of-screen' data-testid='dropdown' className='rcx-dropdown__bottom-sheet' {...props}>
			<Box rcx-dropdown__bottom-sheet-content>{children}</Box>
		</PopoverSurface>
	);
}
