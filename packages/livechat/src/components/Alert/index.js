import { useEffect } from 'preact/hooks';

import CloseIcon from '../../icons/close.svg';
import { createClassName } from '../helpers';
import styles from './styles.scss';

const Alert = ({
	id,
	onDismiss,
	success,
	warning,
	error,
	color,
	hideCloseButton = false,
	className,
	style = {},
	children,
	timeout = 3000,
}) => {
	const handleDismiss = () => {
		onDismiss && onDismiss(id);
	};

	useEffect(() => {
		if (Number.isFinite(timeout) && timeout > 0) {
			this.dismissTimeout = setTimeout(this.handleDismiss, timeout);
		}
		return () => clearTimeout(this.dismissTimeout);
	}, [timeout]);

	return (
		<div
			role='alert'
			className={createClassName(styles, 'alert', { success, warning, error }, [className])}
			style={{
				...style,
				...(color && { backgroundColor: color }),
			}}
		>
			<div className={createClassName(styles, 'alert__content')}>{children}</div>
			{!hideCloseButton && (
				<button onClick={handleDismiss} className={createClassName(styles, 'alert__close')} aria-label={t('dismiss_this_alert')}>
					<CloseIcon width={20} height={20} />
				</button>
			)}
		</div>
	);
};

export default Alert;
