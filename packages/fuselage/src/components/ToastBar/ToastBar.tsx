import { type ReactNode, type AllHTMLAttributes, useId } from 'react';

import ToastBarClose from './ToastBarClose';
import ToastBarIcon from './ToastBarIcon';
import ToastBarMessage from './ToastBarMessage';
import ToastBarProgress from './ToastBarProgress';
import ToastBarSurface from './ToastBarSurface';

export type ToastBarProps = {
	variant?: 'info' | 'success' | 'error';
	className?: string;
	children?: ReactNode;
	time?: number;
	isPaused?: boolean;
	id?: string;
	onClose?: (id: string) => void;
	buttonLabel?: string;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

/**
 * Shows alerts in a toast component.
 */
function ToastBar({ children, variant = 'info', time = 5, isPaused, id, onClose, buttonLabel = 'Dismiss alert', ...props }: ToastBarProps) {
	const uniqueId = useId();
	const toastId = id || uniqueId;

	return (
		<ToastBarSurface {...props} variant={variant} id={id}>
			<ToastBarIcon />
			<ToastBarMessage>{children}</ToastBarMessage>
			{onClose && <ToastBarClose label={buttonLabel} onClose={() => onClose(toastId)} />}
			<ToastBarProgress time={time} paused={isPaused} />
		</ToastBarSurface>
	);
}

export default ToastBar;
