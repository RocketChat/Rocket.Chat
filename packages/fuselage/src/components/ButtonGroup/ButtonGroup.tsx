import type { HTMLAttributes, RefAttributes } from 'react';

export type ButtonGroupProps = RefAttributes<HTMLDivElement> & {
	align?: 'start' | 'center' | 'end';
	/** `equal` also gives every button the same width. */
	stretch?: boolean | 'equal';
	wrap?: boolean;
	vertical?: boolean;
	small?: boolean;
	large?: boolean;
} & HTMLAttributes<HTMLDivElement>;

/**
 * A container for grouping buttons that semantically share a common action context.
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
