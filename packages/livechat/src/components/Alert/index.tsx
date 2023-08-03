import type { ComponentChildren } from 'preact';
import { useCallback, useEffect } from 'preact/hooks';
import type { JSXInternal } from 'preact/src/jsx';
import { useTranslation } from 'react-i18next';

import { createClassName } from '../../helpers/createClassName';
import CloseIcon from '../../icons/close.svg';
import styles from './styles.scss';

type AlertProps = {
	id?: string;
	onDismiss?: (id?: string) => void;
	success?: boolean;
	warning?: boolean;
	error?: boolean;
	color?: string;
	hideCloseButton?: boolean;
	className?: string;
	style?: JSXInternal.CSSProperties;
	children?: ComponentChildren;
	timeout?: number;
};

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
}: AlertProps) => {
	const { t } = useTranslation();
	const handleDismiss = useCallback(() => {
		onDismiss?.(id);
	}, [id, onDismiss]);

	useEffect(() => {
		let dismissTimeout: ReturnType<typeof setTimeout> | undefined;
		if (Number.isFinite(timeout) && timeout > 0) {
			dismissTimeout = setTimeout(handleDismiss, timeout);
		}
		return () => clearTimeout(dismissTimeout);
	}, [handleDismiss, timeout]);

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
