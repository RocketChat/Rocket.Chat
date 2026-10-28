import { styled, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, CSSProperties, RefAttributes } from 'react';

import { statusBackgroundColors, statusColors, surfaceColors } from '../../Theme';
import { cx } from '../../helpers/composeClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, fontFamily } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const progressBarBorderRadius = toCSSValue(
	'--rcx-progress-bar-border-radius',
	toCSSValue('--rcx-border-radius-large', borderRadius('large')),
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

const colors = {
	info: 'status-font-on-info',
	success: 'status-font-on-success',
	warning: 'status-font-on-warning',
	danger: 'status-font-on-danger',
} as const;
const lightColors = {
	info: 'status-background-info',
	success: 'status-background-success',
	warning: 'status-background-warning',
	danger: 'status-background-danger',
} as const;

const ProgressBarFill = styled(View, {
	...resetBox,
	// The percentage travels as a custom property, so the frame's styles stay static and app CSS can still override them
	width: 'var(--rcx-progress-bar-fill-width)',

	variants: {
		fillColor: {
			...Object.fromEntries(Object.values(colors).map((name) => [name, { backgroundColor: String(statusColors[name]) }])),
			...Object.fromEntries(Object.values(lightColors).map((name) => [name, { backgroundColor: String(statusBackgroundColors[name]) }])),
		} as Record<(typeof colors)[keyof typeof colors] | (typeof lightColors)[keyof typeof lightColors], { backgroundColor: string }>,
	} as const,
});

const ProgressBarShine = styled(View, {
	position: 'absolute',
	inset: 0,
	width: 'inherit',
	opacity: 0,
	borderRadius: progressBarBorderRadius,
	background: toCSSValue('--rcx-progress-bar-color-shine', `${surfaceColors['surface-light']}`),
});

const getWidth = (percentage: number): string => `${Math.min(Math.max(0, percentage), 100).toFixed(1)}%`;

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
function ProgressBar({ percentage, variant = 'info', error, animated, light = false, className, ...props }: ProgressBarProps) {
	return (
		<ProgressBarFrame
			{...({ title: error || undefined, ...props } as GetProps<typeof ProgressBarFrame>)}
			className={cx('rcx-progress-bar', className)}
		>
			<ProgressBarFill
				fillColor={getColor(light, variant, error)}
				style={{ '--rcx-progress-bar-fill-width': getWidth(percentage) } as CSSProperties}
				className={cx('rcx-progress-bar__fill', animated && 'rcx-progress-bar__fill--animated')}
			>
				{animated && <ProgressBarShine aria-hidden className='rcx-progress-bar__shine' />}
			</ProgressBarFill>
		</ProgressBarFrame>
	);
}

export default withFuselageProvider(ProgressBar);
