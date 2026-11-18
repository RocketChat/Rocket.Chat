import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';
import type { ReactElement, RefObject } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { AnimatedVisibility } from '../AnimatedVisibility';
import Position from './Position';

export type PositionAnimatedProps = Omit<ElementProps<HTMLElement>, 'children'> & {
	/** Element the child is placed next to. */
	anchor: RefObject<Element | null>;
	/**
	 * A single element that accepts a ref, `style` and `className`; it also receives the side it ended up on as
	 * `placement`.
	 */
	children: ReactElement<any>;
	/** Space, in pixels, between the anchor and the child. */
	margin?: number;
	/**
	 * Side of the anchor the child goes on, then how it aligns along that side; another side is tried when it doesn't
	 * fit.
	 */
	placement?: UsePositionOptions['placement'];
	/**
	 * Holds the page still while the child is shown, so it cannot drift away from its anchor; the child itself still
	 * scrolls.
	 */
	preventScroll?: boolean;
	/**
	 * Changing it to `visible` slides the child in; changing it to `hidden` slides it out and then unmounts it. Defaults
	 * to `hidden`, so nothing renders until it is set.
	 */
	visible?: 'hidden' | 'visible' | 'hiding' | 'unhiding';
};

/**
 * Places its child next to an anchor element, following the anchor as the page scrolls or resizes, and slides it in
 * and out as `visible` changes. The other props go to the child.
 */
const PositionAnimated = ({ visible, children, ...props }: PositionAnimatedProps) => (
	<AnimatedVisibility visibility={visible}>
		<Position {...props}>{children}</Position>
	</AnimatedVisibility>
);

export default PositionAnimated;
