import { styled, View, type GetProps } from '@tamagui/web';
import { Children, type HTMLAttributes, type RefAttributes } from 'react';

import { ButtonSegmentContext, type ButtonSegment } from '../Button/ButtonSegmentContext';
import { buttonBorderRadius, ghostButtonColors } from '../Button/buttonColors';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const SplitButtonFrame = styled(View, {
	render: 'div',
	display: 'inline-flex',
	flexDirection: 'row',
	flexWrap: 'nowrap',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	alignItems: 'stretch',
	borderRadius: buttonBorderRadius,
	// Covered by the opaque action; shows through the ghost segment. Translucency lives in the color, as
	// `opacity` would fade the children
	backgroundColor: ghostButtonColors.secondary.groupBackgroundColor,

	variants: {
		variant: {
			danger: { backgroundColor: ghostButtonColors.danger.groupBackgroundColor },
			warning: { backgroundColor: ghostButtonColors.warning.groupBackgroundColor },
			success: { backgroundColor: ghostButtonColors.success.groupBackgroundColor },
			primary: { backgroundColor: ghostButtonColors.primary.groupBackgroundColor },
		},
	} as const,
});

export type SplitButtonProps = RefAttributes<HTMLDivElement> &
	HTMLAttributes<HTMLDivElement> & {
		danger?: boolean;
		warning?: boolean;
		success?: boolean;
		primary?: boolean;
	} & ({ 'aria-label': string } | { 'aria-labelledby': string });

const getPosition = (index: number, count: number): ButtonSegment['position'] => {
	if (count === 1) return 'only';
	if (index === 0) return 'first';
	if (index === count - 1) return 'last';
	return 'middle';
};

/**
 * Fuses a menu trigger and its primary action into a single control, e.g. an
 * audio device menu next to a microphone toggle. The menu trigger is a
 * `SplitButtonTrigger`, rendered as a ghost segment wherever it sits.
 */
function SplitButton({ className, danger, warning, success, primary, children, ...props }: SplitButtonProps) {
	const variant = (danger && 'danger') || (warning && 'warning') || (success && 'success') || (primary && 'primary') || undefined;
	const segments = Children.toArray(children);

	return (
		<SplitButtonFrame
			role='group'
			className={[
				'rcx-split-button',
				danger && 'rcx-split-button--danger',
				warning && 'rcx-split-button--warning',
				success && 'rcx-split-button--success',
				primary && 'rcx-split-button--primary',
				className,
			]
				.filter(Boolean)
				.join(' ')}
			variant={variant}
			{...(props as GetProps<typeof SplitButtonFrame>)}
		>
			{segments.map((segment, index) => (
				<ButtonSegmentContext.Provider
					key={index}
					value={{ position: getPosition(index, segments.length), variant: variant ?? 'secondary' }}
				>
					{segment}
				</ButtonSegmentContext.Provider>
			))}
		</SplitButtonFrame>
	);
}

export default withFuselageProvider(SplitButton);
