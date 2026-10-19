import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes, RefAttributes } from 'react';

import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

/** Layout of `rcx-split-button`; the segment colors stay in `SplitButton.styles.scss`, next to the button colors they derive from. */
const SplitButtonFrame = styled(View, {
	render: 'div',
	display: 'inline-flex',
	flexDirection: 'row',
	flexWrap: 'nowrap',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	alignItems: 'stretch',
	borderRadius: toCSSValue('--rcx-button-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium')!)),
});

export type SplitButtonProps = RefAttributes<HTMLDivElement> &
	HTMLAttributes<HTMLDivElement> & {
		danger?: boolean;
		warning?: boolean;
		success?: boolean;
		primary?: boolean;
	} & ({ 'aria-label': string } | { 'aria-labelledby': string });

/**
 * Fuses a menu trigger and its primary action into a single control, e.g. an
 * audio device menu next to a microphone toggle. The menu trigger is a
 * `SplitButtonTrigger`, rendered as a ghost segment wherever it sits.
 */
function SplitButton({ className, danger, warning, success, primary, ...props }: SplitButtonProps) {
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
			{...(props as GetProps<typeof SplitButtonFrame>)}
		/>
	);
}

export default withFuselageProvider(SplitButton);
