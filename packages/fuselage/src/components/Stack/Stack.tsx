import type { HTMLAttributes, RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';

export type StackProps = RefAttributes<HTMLDivElement> & {
	direction?: 'row' | 'column';
	gap?: BoxProps['gap'];
	align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
	justify?: 'start' | 'center' | 'end' | 'space-between';
	wrap?: boolean;
	grow?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'is'>;

const flexValues: Record<string, string> = { start: 'flex-start', end: 'flex-end' };

/**
 * Lays out its children in a row or a column, spaced by `gap`.
 */
function Stack({ direction = 'column', gap, align, justify, wrap, grow, ...props }: StackProps) {
	return (
		<Box
			display='flex'
			flexDirection={direction}
			gap={gap}
			alignItems={align && (flexValues[align] ?? align)}
			justifyContent={justify && (flexValues[justify] ?? justify)}
			flexWrap={wrap ? 'wrap' : undefined}
			flexGrow={grow ? 1 : undefined}
			{...props}
		/>
	);
}

export default Stack;
