import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

const parsePlacement = (placement: string | null | undefined) => {
	const [direction, position] = placement ? placement.split('-') : [undefined, undefined];

	if (direction === 'right' || direction === 'left') {
		return [direction, undefined];
	}

	return [direction, position];
};

export type TooltipProps = ElementProps<HTMLElement> & {
	variation?: 'dark' | 'light';
	/**
	 * Where the tooltip sits relative to its element; the arrow points back at the element. The `-start`, `-middle` and
	 * `-end` suffixes move the arrow from left to right, in any text direction. Without it, there is no arrow.
	 */
	placement?:
		'top-start' | 'top-middle' | 'top-end' | 'bottom-start' | 'bottom-middle' | 'bottom-end' | 'top' | 'left' | 'bottom' | 'right' | null;
};

/**
 * Shows short, complementary information about an element the user hovers. It doesn't open or position itself: place it
 * next to the element, as `PositionAnimated` does.
 */
function Tooltip({ variation = 'dark', placement, ...props }: TooltipProps) {
	const [direction, position] = parsePlacement(placement);

	return (
		<Box
			is='div'
			rcx-tooltip
			rcx-tooltip--dir={direction}
			rcx-tooltip--pos={position}
			rcx-tooltip--light={variation === 'light'}
			rcx-tooltip--dark={variation === 'dark'}
			{...props}
		/>
	);
}

export default Tooltip;
