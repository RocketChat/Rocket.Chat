import type { HTMLAttributes, ReactNode, RefAttributes } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { Box } from '../Box';
import { PopoverSurface } from '../PopoverSurface';

export type DropdownMobileProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'style' | 'color'> &
	RefAttributes<HTMLElement> & {
		children: ReactNode;
	};

export function DropdownMobile({ children, className, ...props }: DropdownMobileProps) {
	return (
		<PopoverSurface flush maxHeight='most-of-screen' data-testid='dropdown' {...props} className={appendClassName(className, 'rcx-dropdown__bottom-sheet')}>
			<Box rcx-dropdown__bottom-sheet-content>{children}</Box>
		</PopoverSurface>
	);
}
