import type { AllHTMLAttributes, RefAttributes } from 'react';

import { Box } from '../Box';

const getWidth = (percentage: number): string => `${Math.min(Math.max(0, percentage), 100).toFixed(1)}%`;

const colors = {
	info: 'status-font-on-info',
	success: 'status-font-on-success',
	warning: 'status-font-on-warning',
	danger: 'status-font-on-danger',
};
const lightColors = {
	info: 'status-background-info',
	success: 'status-background-success',
	warning: 'status-background-warning',
	danger: 'status-background-danger',
};

const getColor = (isLight: boolean, variant: 'info' | 'success' | 'warning' | 'danger', error?: string) => {
	if (error) {
		return isLight ? lightColors.danger : colors.danger;
	}
	return isLight ? lightColors[variant] : colors[variant];
};

export type ProgressBarProps = RefAttributes<unknown> & {
	/** How much of the bar is filled, from 0 to 100; values out of that range are clamped. */
	percentage: number;
	/** Color of the fill, for the state of the progress or consumption. */
	variant?: 'info' | 'success' | 'warning' | 'danger';
	/** Turns the fill to the `danger` color, whatever the `variant`, and shows the message as a tooltip on hover. */
	error?: string;
	/** Sweeps a shine across the fill, to show that the operation is ongoing. */
	animated?: boolean;
	/** Uses a paler fill color. */
	light?: boolean;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

/** Shows how far an operation has gone, or how much of a quota is used. */
function ProgressBar({ percentage, variant = 'info', error, animated, light = false, ...props }: ProgressBarProps) {
	return (
		<Box rcx-progress-bar title={error || undefined} overflow='hidden' {...props}>
			<Box
				backgroundColor={getColor(light, variant, error)}
				rcx-progress-bar__fill--animated={animated}
				rcx-progress-bar__fill
				width={getWidth(percentage)}
			/>
		</Box>
	);
}

export default ProgressBar;
