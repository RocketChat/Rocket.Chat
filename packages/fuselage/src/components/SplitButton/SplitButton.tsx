import type { HTMLAttributes, RefAttributes } from 'react';

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
		<div
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
			{...props}
		/>
	);
}

export default SplitButton;
