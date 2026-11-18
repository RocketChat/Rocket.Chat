import { type ReactNode, type AllHTMLAttributes, type CSSProperties, useId } from 'react';

import { Box } from '../Box';
import { IconButton } from '../Button';
import { Icon } from '../Icon';

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
