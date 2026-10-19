import type { ReactNode, RefAttributes } from 'react';

import { Box, Tile } from '..';

export type DropdownMobileProps = RefAttributes<HTMLElement> & {
	children: ReactNode;
};

export function DropdownMobile({ children, ...props }: DropdownMobileProps) {
	return (
		<Tile
			elevation='2'
			paddingInline='0'
			paddingBlock='0'
			width='100vw'
			maxHeight='80%'
			position='fixed'
			display='flex'
			flexDirection='column'
			overflow='auto'
			style={{ bottom: 0, left: 0 }}
			zIndex={2}
			data-testid='dropdown'
			{...props}
		>
			<Box flexShrink={1} paddingBlock={16}>
				{children}
			</Box>
		</Tile>
	);
}
