import type { UsePositionOptions } from '@rocket.chat/fuselage-hooks';

type ReactAriaPlacement =
	| 'bottom'
	| 'bottom left'
	| 'bottom right'
	| 'bottom start'
	| 'bottom end'
	| 'top'
	| 'top left'
	| 'top right'
	| 'top start'
	| 'top end'
	| 'left'
	| 'left top'
	| 'left bottom'
	| 'start'
	| 'start top'
	| 'start bottom'
	| 'right'
	| 'right top'
	| 'right bottom'
	| 'end'
	| 'end top'
	| 'end bottom';

export const getPlacement = (placement: UsePositionOptions['placement']): ReactAriaPlacement => {
	// switch case for placement from usePosition placement to react-aria
	switch (placement) {
		case 'bottom':
			return 'bottom';

		case 'bottom-start':
			return 'bottom start';
		case 'bottom-end':
			return 'bottom end';
		case 'top':
			return 'top';

		case 'top-start':
			return 'top start';
		case 'top-end':
			return 'top end';
		case 'left':
			return 'left';
		case 'left-start':
			return 'left top';
		case 'left-end':
			return 'left bottom';
		case 'right':
			return 'right';
		case 'right-start':
			return 'right top';
		case 'right-end':
			return 'right bottom';
		default:
			return 'bottom start';
	}
};
