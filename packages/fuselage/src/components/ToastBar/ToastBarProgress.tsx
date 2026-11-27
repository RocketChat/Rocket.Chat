import type { ComponentProps, CSSProperties } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';

export type ToastBarProgressProps = {
	/**
	 * Seconds the bar takes to fill.
	 */
	time?: number;
	/**
	 * Holds the bar where it is, as while the pointer is over the toast.
	 */
	paused?: boolean;
} & Omit<ComponentProps<'div'>, 'is'>;

/**
 * The bar along the toast's bottom edge that fills while the toast is shown.
 */
const ToastBarProgress = ({ time = 5, paused, className, style, ...props }: ToastBarProgressProps) => (
	<div
		{...props}
		className={cx(cxx('rcx-toastbar_progressbar')({ paused: !!paused }), className)}
		style={{ ...style, '--toast-time': `${time}s` } as CSSProperties}
	/>
);

export default ToastBarProgress;
