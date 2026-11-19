import type { FieldsetHTMLAttributes, FormHTMLAttributes, HTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { Box, type BoxProps } from '../Box';

export type StackProps = RefAttributes<HTMLElement> & {
	/**
	 * The element it renders, so a section, a list or a form keeps its meaning for assistive technology. `ul` and
	 * `fieldset` lose their markers, indentation, border and spacing; a `span` is still a block-level flex container.
	 */
	is?: 'div' | 'section' | 'ul' | 'li' | 'form' | 'fieldset' | 'span';
	direction?: 'row' | 'column';
	/** Space between the children, as a spacing token (`x8`) or a number of pixels. */
	gap?: BoxProps['gap'];
	/** Aligns the children across the direction they're laid out in. */
	align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
	/** Distributes the children along the direction they're laid out in. */
	justify?: 'start' | 'center' | 'end' | 'space-between';
	/** Lets the children wrap onto new lines when they don't fit. */
	wrap?: boolean;
	/** Fills the free space of a flex parent, such as another `Stack`. */
	grow?: boolean;
} & Omit<HTMLAttributes<HTMLElement>, 'color' | 'is'> &
	Pick<FormHTMLAttributes<HTMLFormElement>, 'action' | 'method' | 'noValidate' | 'autoComplete'> &
	Pick<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'disabled' | 'name' | 'form'>;

const flexValues: Record<string, string> = { start: 'flex-start', end: 'flex-end' };

const resetClassNames: Partial<Record<NonNullable<StackProps['is']>, string>> = {
	ul: 'rcx-stack--list',
	fieldset: 'rcx-stack--fieldset',
};

/**
 * Lays out its children in a row or a column, spaced by `gap`. It lines up with Tamagui's `XStack` and `YStack`,
 * whose `alignItems`, `justifyContent`, `flexWrap` and `flexGrow` are its `align`, `justify`, `wrap` and `grow`.
 */
function Stack({ is = 'div', direction = 'column', gap, align, justify, wrap, grow, className, ...props }: StackProps) {
	return (
		<Box
			is={is}
			role={is === 'ul' ? 'list' : undefined}
			className={cx(resetClassNames[is], className) || undefined}
			display='flex'
			flexDirection={direction}
			gap={gap}
			alignItems={align && (flexValues[align] ?? align)}
			justifyContent={justify && (flexValues[justify] ?? justify)}
			flexWrap={wrap ? 'wrap' : undefined}
			flexGrow={grow ? 1 : undefined}
			{...props}
		/>
	);
}

export default Stack;
