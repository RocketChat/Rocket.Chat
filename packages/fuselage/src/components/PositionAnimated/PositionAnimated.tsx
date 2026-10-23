import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import type { ReactElement, RefObject } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { AnimatedVisibility } from '../AnimatedVisibility';
import Position from './Position';

export type PositionAnimatedProps = Omit<ElementProps<HTMLElement>, 'children'> & {
	anchor: RefObject<Element | null>;
	children: ReactElement<any>;
	margin?: number;
	placement?: UsePositionOptions['placement'];
	visible?: 'hidden' | 'visible' | 'hiding' | 'unhiding';
};

const PositionAnimated = ({ visible, children, ...props }: PositionAnimatedProps) => (
	<AnimatedVisibility visibility={visible}>
		<Position {...props}>{children}</Position>
	</AnimatedVisibility>
);

export default PositionAnimated;
