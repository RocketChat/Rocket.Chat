import type { CSSProperties, ReactNode, RefAttributes } from 'react';

import { Box, Tile } from '..';

export type DropdownDesktopProps = RefAttributes<HTMLElement> & {
	children: ReactNode;
	maxWidth?: string;
	maxHeight?: string;
	overflowY?: CSSProperties['overflowY'];
	style?: CSSProperties;
};

export function DropdownDesktop({ children, style, ...props }: DropdownDesktopProps) {
	return (
		<Tile
			style={style}
			elevation='2'
			paddingInline='0'
			paddingBlock='0'
			display='flex'
			flexDirection='column'
			overflow='auto'
			data-testid='dropdown'
			{...props}
		>
			<Box flexShrink={1} paddingBlock={12}>
				{style?.visibility === 'hidden' ? null : children}
			</Box>
		</Tile>
	);
}
