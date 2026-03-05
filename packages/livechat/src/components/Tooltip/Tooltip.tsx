import type { HTMLAttributes } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

export type Placement = 'left' | 'top' | 'right' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

const getPositioningStyle = (
	placement: Placement,
	{ left, top, right, bottom }: { left: number; top: number; right: number; bottom: number },
) => {
	switch (placement) {
		case 'left':
			return {
				left: `${left}px`,
				top: `${(top + bottom) / 2}px`,
			};

		case 'top':
		case 'top-left':
		case 'top-right':
			return {
				left: `${(left + right) / 2}px`,
				top: `${top}px`,
			};

		case 'right':
			return {
				left: `${right}px`,
				top: `${(top + bottom) / 2}px`,
			};

		case 'bottom':
		case 'bottom-left':
		case 'bottom-right':
		default:
			return {
				left: `${(left + right) / 2}px`,
				top: `${bottom}px`,
			};
	}
};

export type TooltipProps = {
	hidden?: boolean;
	placement: Placement;
	floating?: boolean;
	triggerBounds: { left: number; top: number; right: number; bottom: number };
} & Omit<HTMLAttributes<HTMLDivElement>, 'ref'>;

const Tooltip = ({ children, hidden = false, placement, floating = false, triggerBounds, ...props }: TooltipProps) => (
	<div
		className={createClassName(styles, 'tooltip', { hidden, placement, floating })}
		style={floating ? getPositioningStyle(placement, triggerBounds) : {}}
		{...props}
	>
		{children}
	</div>
);

export default Tooltip;
