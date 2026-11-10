import type { FieldsetHTMLAttributes, FormHTMLAttributes, HTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { Box, type BoxProps } from '../Box';

export type StackProps = RefAttributes<HTMLElement> & {
	/** The element it renders, so a section, a list or a form keeps its meaning for assistive technology. A `span` is still a block-level flex container. */
	is?: 'div' | 'section' | 'ul' | 'li' | 'form' | 'fieldset' | 'span';
	direction?: 'row' | 'column';
	gap?: BoxProps['gap'];
	align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
	justify?: 'start' | 'center' | 'end' | 'space-between';
	wrap?: boolean;
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
 * Lays out its children in a row or a column, spaced by `gap`.
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
