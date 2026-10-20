import { styled, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, RefAttributes } from 'react';

import { surfaceColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderRadius, fontFamily } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const progressBarBorderRadius = toCSSValue(
	'--rcx-progress-bar-border-radius',
	toCSSValue('--rcx-border-radius-large', borderRadius('large')!),
);

const resetBox = {
	display: 'block',
	flex: '0 1 auto',
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
	outline: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	height: 8,
	borderRadius: progressBarBorderRadius,
} as const;

const ProgressBarFrame = styled(View, {
	...resetBox,
	overflow: 'hidden',
	width: '100%',
	backgroundColor: toCSSValue('--rcx-progress-bar-color-background', surfaceColors['surface-neutral']),
});

const ProgressBarFill = styled(View, resetBox);

const ProgressBarShine = styled(View, {
	position: 'absolute',
	inset: 0,
	width: 'inherit',
	animation: 'rcx-progress-bar__animation 2s ease-out infinite',
	opacity: 0,
	borderRadius: progressBarBorderRadius,
	background: toCSSValue('--rcx-progress-bar-color-shine', `${surfaceColors['surface-light']}`),
});

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
	percentage: number;
	variant?: 'info' | 'success' | 'warning' | 'danger';
	error?: string;
	animated?: boolean;
	light?: boolean;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

/**
 * The `ProgressBar` is used to inform the user the progress of an operation.
 */
function ProgressBar({ percentage, variant = 'info', error, animated, light = false, ...props }: ProgressBarProps) {
	const frameProps = useTamaguiBoxProps({ 'rcx-progress-bar': true, 'title': error || undefined, 'overflow': 'hidden', ...props });
	const fillProps = useTamaguiBoxProps({
		'backgroundColor': getColor(light, variant, error),
		'rcx-progress-bar__fill--animated': animated,
		'rcx-progress-bar__fill': true,
		'width': getWidth(percentage),
	} as BoxProps);

	return (
		<ProgressBarFrame {...(frameProps as GetProps<typeof ProgressBarFrame>)}>
			<ProgressBarFill {...(fillProps as GetProps<typeof ProgressBarFill>)}>{animated && <ProgressBarShine aria-hidden />}</ProgressBarFill>
		</ProgressBarFrame>
	);
}

export default withFuselageProvider(ProgressBar, { takesBoxTransforms: true });
