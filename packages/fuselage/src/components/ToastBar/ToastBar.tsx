import { css, keyframes } from '@rocket.chat/css-in-js';
import { type ReactNode, type AllHTMLAttributes, useId } from 'react';

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

	const sideOpen = keyframes`
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  `;

	const progressBar = keyframes`
    from {
      width: 0%;
    }

    to {
      width: 100%;
    }
  `;

	const toastBarAnimation = css`
		animation: ${sideOpen} 0.5s;
	`;

	const progressBarAnimation = css`
		&::after {
			width: 0%;
			animation: ${progressBar} ${time}s;
			animation-fill-mode: forwards;
			animation-play-state: ${isPaused ? 'paused' : 'running'};
		}
	`;

	const uniqueId = useId();
	const toastId = id || uniqueId;

	const role = variant === 'error' ? 'alert' : 'status';

	return (
		<Box
			className={[`rcx-toastbar rcx-toastbar--${variant} ${className}`, toastBarAnimation]}
			id={id}
			elevation='2nb'
			borderRadius='medium'
			{...props}
		>
			<div className='rcx-toastbar_inner'>
				<Icon className={`rcx-toastbar_icon--${variant}`} size='x20' name={iconName} />
				<div role={role} className='rcx-toastbar_content'>
					{children}
				</div>
				{onClose && (
					<div className='rcx-toastbar-close'>
						<IconButton tiny aria-label={buttonLabel} onClick={() => onClose(toastId)} icon='cross' />
					</div>
				)}
			</div>
			<Box className={[progressBarAnimation, 'rcx-toastbar_progressbar']} />
		</Box>
	);
}

export default ToastBar;
