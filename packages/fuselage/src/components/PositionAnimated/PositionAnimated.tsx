import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import type { ReactElement, RefObject } from 'react';

import { AnimatedVisibility } from '../AnimatedVisibility';
import type { BoxProps } from '../Box';
import Position from './Position';

export type PositionAnimatedProps = Omit<BoxProps, 'children' | 'margin'> & {
	anchor: RefObject<Element | null>;
	children: ReactElement<any>;
	margin?: number;
	placement?: UsePositionOptions['placement'];
	preventScroll?: boolean;
	visible?: 'hidden' | 'visible' | 'hiding' | 'unhiding';
};

const PositionAnimated = ({ width: _width, visible, children, ...props }: PositionAnimatedProps) => (
	<AnimatedVisibility visibility={visible}>
		<Position {...props}>{children}</Position>
	</AnimatedVisibility>
);

export default PositionAnimated;
