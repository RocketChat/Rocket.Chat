import type { HTMLAttributes, RefAttributes } from 'react';

export type ButtonGroupProps = RefAttributes<HTMLDivElement> & {
	/** Where the buttons sit along the row, or along the column when `vertical`. */
	align?: 'start' | 'center' | 'end';
	/** Grows the buttons to fill the row, square ones excepted. `equal` also gives them the same width. */
	stretch?: boolean | 'equal';
	/** Moves buttons that don't fit onto a new line. */
	wrap?: boolean;
	vertical?: boolean;
	/** Narrows the gap between buttons to 4px. The buttons keep their size. */
	small?: boolean;
	/** Widens the gap between buttons to 16px. The buttons keep their size. */
	large?: boolean;
} & HTMLAttributes<HTMLDivElement>;

/**
 * Lays out related buttons together, 8px apart, and marks them as one group of actions for assistive technology.
 */
function ButtonGroup({ align = 'start', children, stretch, vertical, wrap, small, large, className, ...props }: ButtonGroupProps) {
	return (
		<div
			className={[
				'rcx-button-group',
				stretch && 'rcx-button-group--stretch',
				stretch === 'equal' && 'rcx-button-group--stretch-equal',
				vertical && 'rcx-button-group--vertical',
				align && `rcx-button-group--align-${align}`,
				small && 'rcx-button-group--small',
				large && 'rcx-button-group--large',
				wrap && 'rcx-button-group--wrap',
				className,
			]
				.filter(Boolean)
				.join(' ')}
			role='group'
			{...props}
		>
			{children}
		</div>
	);
}

export default ButtonGroup;
