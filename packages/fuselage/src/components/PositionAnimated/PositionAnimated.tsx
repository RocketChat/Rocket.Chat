import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import type { ReactElement, RefObject } from 'react';

import Position from './Position.js';
import type { ElementProps } from '../../types/ElementProps.js';
import { AnimatedVisibility } from '../AnimatedVisibility/index.js';

export type PositionAnimatedProps = Omit<ElementProps<HTMLElement>, 'children'> & {
	anchor: RefObject<Element | null>;
	children: ReactElement<any>;
	margin?: number;
	placement?: UsePositionOptions['placement'];
	preventScroll?: boolean;
	visible?: 'hidden' | 'visible' | 'hiding' | 'unhiding';
};

const PositionAnimated = ({ visible, children, ...props }: PositionAnimatedProps) => (
	<AnimatedVisibility visibility={visible}>
		<Position {...props}>{children}</Position>
	</AnimatedVisibility>
);

export default PositionAnimated;
