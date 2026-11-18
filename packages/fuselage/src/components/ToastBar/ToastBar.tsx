import { type ReactNode, type AllHTMLAttributes, type CSSProperties, useId } from 'react';

import { Box } from '../Box';
import { IconButton } from '../Button';
import { Icon } from '../Icon';

export type ToastBarProps = {
	/**
	 * Sets the color and the icon. Assistive technology announces an `error` right away, and the others when the user
	 * is idle.
	 */
	variant?: 'info' | 'success' | 'error';
	className?: string;
	children?: ReactNode;
	/** Seconds the progress bar takes to run out; match it to how long the toast stays on screen. */
	time?: number;
	/** Stops the progress bar, as while the pointer is over the toast. */
	isPaused?: boolean;
	/** Passed to `onClose`; without it, `onClose` gets a generated one. */
	id?: string;
	/** Shows a close button that calls it with the toast's `id`. */
	onClose?: (id: string) => void;
	/** Accessible name of the close button. */
	buttonLabel?: string;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

/**
 * Reports the outcome of an action the user just took, for a few seconds. The bar along its bottom shows the time
 * left; removing the toast when it runs out is up to the code that shows it.
 */
function ToastBar({
	children,
	className = '',
	variant = 'info',
	time = 5,
	isPaused,
	id,
	onClose,
	buttonLabel = 'Dismiss alert',
	...props
}: ToastBarProps) {
	const iconName = (variant === 'success' && 'circle-check') || (variant === 'error' && 'ban') || 'info';

	const uniqueId = useId();
	const toastId = id || uniqueId;

	const role = variant === 'error' ? 'alert' : 'status';

	return (
		<Box className={`rcx-toastbar rcx-toastbar--${variant} ${className}`} id={id} elevation='2nb' borderRadius='medium' {...props}>
			<div className='rcx-toastbar_inner'>
				<Icon className={`rcx-toastbar_icon--${variant}`} size='x20' name={iconName} />
				<div role={role} className='rcx-toastbar_content'>
					{children}
				</div>
				{onClose && (
					<div className='rcx-toastbar-close'>
						<IconButton size='tiny' aria-label={buttonLabel} onClick={() => onClose(toastId)} icon='cross' />
					</div>
				)}
			</div>
			<Box
				className={`rcx-toastbar_progressbar${isPaused ? ' rcx-toastbar_progressbar--paused' : ''}`}
				style={{ '--toast-time': `${time}s` } as CSSProperties}
			/>
		</Box>
	);
}

export default ToastBar;
