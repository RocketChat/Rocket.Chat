import type { ReactElement } from 'react';
import { useMemo } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box, type BoxProps } from '../Box';
import { Icon } from '../Icon';

export type ChevronProps = ElementProps<HTMLSpanElement> & {
	/** Size of the glyph: a size token such as `x20`, or a number of pixels. */
	size?: BoxProps['width'];
	up?: boolean;
	/** Points to where the line ends: right in left-to-right text, left in right-to-left. */
	right?: boolean;
	/** Points to where the line starts: left in left-to-right text, right in right-to-left. */
	left?: boolean;
	down?: boolean;
	/** Has no effect; use `up`. */
	top?: boolean;
	/** Has no effect; the chevron points down by default. */
	bottom?: boolean;
};

/** An arrowhead pointing down, up, left or right, to show which way something opens or leads. */
function Chevron({ up, right, down, left, size, ...props }: ChevronProps): ReactElement<ChevronProps> {
	const children = useMemo(() => <Icon name='chevron-down' size={size} />, [size]);

	return (
		<Box is='span' rcx-chevron rcx-chevron--up={up} rcx-chevron--right={right} rcx-chevron--down={down} rcx-chevron--left={left} {...props}>
			{children}
		</Box>
	);
}

export default Chevron;
