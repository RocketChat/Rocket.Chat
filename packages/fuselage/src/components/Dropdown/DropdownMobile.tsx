import type { ReactNode, RefAttributes } from 'react';

import { Box } from '../Box';
import { PopoverSurface } from '../PopoverSurface';

export type DropdownMobileProps = RefAttributes<HTMLElement> & {
	children: ReactNode;
};

const bottomSheet = { position: 'fixed', bottom: 0, left: 0, zIndex: 2, width: '100vw' } as const;

export function DropdownMobile({ children, ...props }: DropdownMobileProps) {
	return (
		<PopoverSurface flush maxHeight='most-of-screen' style={bottomSheet} data-testid='dropdown' {...props}>
			<Box paddingBlock={16}>{children}</Box>
		</PopoverSurface>
	);
}
