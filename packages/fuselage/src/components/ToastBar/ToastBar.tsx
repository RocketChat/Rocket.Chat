import { css, keyframes } from '@rocket.chat/css-in-js';
import { styled, Text, View, type GetProps } from '@tamagui/web';
import { type ReactNode, type AllHTMLAttributes, useId } from 'react';

import { surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
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

const toastBarBorderRadius = toCSSValue('--rcx-toastbar-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium')!));

const ToastBarFrame = styled(View, {
	display: 'block',
	position: 'relative',
	flexShrink: 1,
	minWidth: size('x232'),
	minHeight: 'auto',
	maxWidth: size('x416'),
	color: toCSSValue('--rcx-toastbar-color', textIconColors['font-default']),
	borderRadius: toastBarBorderRadius,
	backgroundColor: toCSSValue('--rcx-toastbar-background-color', surfaceColors['surface-tint']),
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	...(fontScale('p2') as object),
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

	const frameProps = useTamaguiBoxProps(
		{ elevation: '2nb', borderRadius: 'medium', ...props, className: [className, toastBarAnimation] },
		`rcx-toastbar rcx-toastbar--${variant}`,
	);
	const progressBarProps = useTamaguiBoxProps({ className: [progressBarAnimation] }, 'rcx-toastbar_progressbar');

	return (
		<ToastBarFrame {...(frameProps as GetProps<typeof ToastBarFrame>)}>
			<ToastBarInner className='rcx-toastbar_inner'>
				<Icon className={`rcx-toastbar_icon--${variant}`} size='x20' name={iconName} />
				<ToastBarContent role={role} className='rcx-toastbar_content'>
					{children}
				</ToastBarContent>
				{onClose && (
					<div className='rcx-toastbar-close'>
						<IconButton tiny aria-label={buttonLabel} onClick={() => onClose(toastId)} icon='cross' />
					</div>
				)}
			</ToastBarInner>
			<ToastBarProgressBar {...progressBarProps} />
		</ToastBarFrame>
	);
}

export default withFuselageProvider(ToastBar, { takesBoxTransforms: true });
