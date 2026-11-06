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
	placement?:
		'top-start' | 'top-middle' | 'top-end' | 'bottom-start' | 'bottom-middle' | 'bottom-end' | 'top' | 'left' | 'bottom' | 'right' | null;
};

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
