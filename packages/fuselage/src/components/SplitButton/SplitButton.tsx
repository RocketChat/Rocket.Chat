import type { HTMLAttributes, RefAttributes } from 'react';

export type SplitButtonProps = RefAttributes<HTMLDivElement> &
	HTMLAttributes<HTMLDivElement> & {
		/** Tints the group and its trigger to match a `secondary-danger` action. */
		danger?: boolean;
		/** Tints the group and its trigger to match a `secondary-warning` action. */
		warning?: boolean;
		/** Tints the group and its trigger to match a `secondary-success` action. */
		success?: boolean;
		/** Tints the group and its trigger to match a `primary` action. */
		primary?: boolean;
	} & ({ 'aria-label': string } | { 'aria-labelledby': string });

/**
 * Fuses an action and a menu of its options into one control, such as a microphone toggle with its device menu. The
 * menu opens from a `SplitButtonTrigger`.
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
