import type { ReactElement } from 'react';
import { useMemo } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box, type BoxProps } from '../Box';
import { Icon } from '../Icon';

export type ChevronProps = ElementProps<HTMLSpanElement> & {
	size?: BoxProps['width'];
	up?: boolean;
	right?: boolean;
	left?: boolean;
	down?: boolean;
	top?: boolean;
	bottom?: boolean;
};

function Chevron({ up, right, down, left, size, ...props }: ChevronProps): ReactElement<ChevronProps> {
	const children = useMemo(() => <Icon name='chevron-down' size={size} />, [size]);

	return (
		<Box is='span' rcx-chevron rcx-chevron--up={up} rcx-chevron--right={right} rcx-chevron--down={down} rcx-chevron--left={left} {...props}>
			{children}
		</Box>
	);
}

export default Chevron;
