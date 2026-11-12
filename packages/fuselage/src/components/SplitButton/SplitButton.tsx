import { Children, isValidElement, type HTMLAttributes, type RefAttributes } from 'react';

import { SegmentContext, segmentValue, type SegmentPosition, type SegmentTone } from '../Button/SegmentContext';

export type SplitButtonProps = RefAttributes<HTMLDivElement> &
	HTMLAttributes<HTMLDivElement> & {
		danger?: boolean;
		warning?: boolean;
		success?: boolean;
		primary?: boolean;
	} & ({ 'aria-label': string } | { 'aria-labelledby': string });

const positionOf = (index: number, count: number): SegmentPosition => {
	if (count === 1) return 'only';
	if (index === 0) return 'first';
	return index === count - 1 ? 'last' : 'middle';
};

/**
 * Fuses a menu trigger and its primary action into a single control, e.g. an
 * audio device menu next to a microphone toggle. The menu trigger is a
 * `SplitButtonTrigger`, rendered as a ghost segment wherever it sits.
 */
function SplitButton({ className, danger, warning, success, primary, children, ...props }: SplitButtonProps) {
	// The last tone set wins, as the last rule did
	const tone: SegmentTone = (primary && 'primary') || (success && 'success') || (warning && 'warning') || (danger && 'danger') || 'default';
	const items = Children.toArray(children);

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
		>
			{items.map((item, index) => (
				<SegmentContext.Provider
					key={isValidElement(item) ? item.key : index}
					value={segmentValue(positionOf(index, items.length), tone, false)}
				>
					{item}
				</SegmentContext.Provider>
			))}
		</div>
	);
}

export default SplitButton;
