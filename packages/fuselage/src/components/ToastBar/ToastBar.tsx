import { css } from '@rocket.chat/css-in-js';
import { styled, Text, View, type GetProps } from '@tamagui/web';
import { type CSSProperties, type ReactNode, type AllHTMLAttributes, useId } from 'react';

import { shadowColors, statusColors, surfaceColors, textIconColors } from '../../Theme';
import { cx } from '../../helpers/composeClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useStyle } from '../../hooks/useStyle';
import { borderRadius, fontFamily, fontScale, size, spacing } from '../../styleTokens';
import { IconButton } from '../Button';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
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

const toastBarBorderRadius = toCSSValue('--rcx-toastbar-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium')));

const ToastBarFrame = styled(View, {
	display: 'block',
	position: 'relative',
	flexShrink: 1,
	minWidth: size('x232'),
	minHeight: 'auto',
	maxWidth: size('x416'),
	color: toCSSValue('--rcx-toastbar-color', textIconColors['font-default']),
	borderRadius: borderRadius('medium'),
	boxShadow: `0px 0px 2px 0px ${String(shadowColors['shadow-elevation-2x'])}, 0px 0px 12px 0px ${String(shadowColors['shadow-elevation-2y'])}`,
	backgroundColor: toCSSValue('--rcx-toastbar-background-color', surfaceColors['surface-tint']),
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	...(fontScale('p2') as object),
});

const toastBarStatusColors = {
	success: toCSSValue('--rcx-toastbar-success-color', statusColors['status-font-on-success']),
	error: toCSSValue('--rcx-toastbar-error-color', statusColors['status-font-on-danger']),
};

const ToastBarStatusLine = styled(View, {
	display: 'block',
	position: 'absolute',
	top: 0,
	width: '100%',
	height: size('x4'),
	borderTopLeftRadius: toastBarBorderRadius,
	borderTopRightRadius: toastBarBorderRadius,
	borderBottomLeftRadius: 0,
	borderBottomRightRadius: 0,
	backgroundColor: 'transparent',

	variants: {
		variant: {
			info: {},
			success: { backgroundColor: toastBarStatusColors.success },
			error: { backgroundColor: toastBarStatusColors.error },
		},
	} as const,
});

const ToastBarInner = styled(View, {
	flexDirection: 'row',
	boxSizing: 'content-box',
	padding: spacing('x16'),
});

const ToastBarContent = styled(Text, {
	render: 'div',
	display: 'block',
	whiteSpace: 'normal',
	wordWrap: 'normal',
	boxSizing: 'content-box',
	width: size('full'),
	marginBlock: 0,
	marginInline: spacing('x16'),
});

const ToastBarProgressBar = styled(View, {
	display: 'block',
	position: 'absolute',
	bottom: 0,
	overflow: 'hidden',
	width: '100%',
	height: size('x4'),
	borderTopLeftRadius: 0,
	borderTopRightRadius: 0,
	borderBottomLeftRadius: toastBarBorderRadius,
	borderBottomRightRadius: toastBarBorderRadius,
});

const ToastBarProgressFill = styled(View, {
	display: 'block',
	height: '100%',
	backgroundColor: toCSSValue('--rcx-toastbar-progressbar-background-color', surfaceColors['surface-neutral']),
});

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

	const iconColorClassName = useStyle(
		variant !== 'info'
			? css`
					color: ${toastBarStatusColors[variant]};
				`
			: undefined,
	);

	return (
		<ToastBarFrame
			id={id}
			{...(props as GetProps<typeof ToastBarFrame>)}
			className={cx('rcx-toastbar', `rcx-toastbar--${variant}`, className)}
		>
			<ToastBarStatusLine aria-hidden variant={variant} />
			<ToastBarInner className='rcx-toastbar_inner'>
				<Icon className={[`rcx-toastbar_icon--${variant}`, iconColorClassName].filter(Boolean).join(' ')} size='x20' name={iconName} />
				<ToastBarContent role={role} className='rcx-toastbar_content'>
					{children}
				</ToastBarContent>
				{onClose && (
					<div className='rcx-toastbar-close'>
						<IconButton size='tiny' aria-label={buttonLabel} onClick={() => onClose(toastId)} icon='cross' />
					</div>
				)}
			</ToastBarInner>
			<ToastBarProgressBar
				className={cx('rcx-toastbar_progressbar', isPaused && 'rcx-toastbar_progressbar--paused')}
				style={{ '--toast-time': `${time}s` } as CSSProperties}
			>
				<ToastBarProgressFill aria-hidden className='rcx-toastbar_progressbar-fill' />
			</ToastBarProgressBar>
		</ToastBarFrame>
	);
}

export default withFuselageProvider(ToastBar);
