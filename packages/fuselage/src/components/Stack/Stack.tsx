import type { FieldsetHTMLAttributes, FormHTMLAttributes, HTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames.js';
import { Box, type BoxProps } from '../Box/index.js';

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

export const stackHostProps = (is: NonNullable<StackProps['is']>) => ({
	role: is === 'ul' ? ('list' as const) : undefined,
	className: resetClassNames[is],
});

export const stackStylingProps = ({
	direction = 'column',
	gap,
	align,
	justify,
	wrap,
	grow,
}: Pick<StackProps, 'direction' | 'gap' | 'align' | 'justify' | 'wrap' | 'grow'>) => ({
	display: 'flex' as const,
	flexDirection: direction,
	gap,
	alignItems: align && (flexValues[align] ?? align),
	justifyContent: justify && (flexValues[justify] ?? justify),
	flexWrap: wrap ? ('wrap' as const) : undefined,
	flexGrow: grow ? 1 : undefined,
});

/**
 * Lays out its children in a row or a column, spaced by `gap`.
 */
function Stack({ is = 'div', direction = 'column', gap, align, justify, wrap, grow, className, ...props }: StackProps) {
	const host = stackHostProps(is);

	return (
		<Box
			is={is}
			role={host.role}
			className={cx(host.className, className) || undefined}
			{...stackStylingProps({ direction, gap, align, justify, wrap, grow })}
			{...props}
		/>
	);
}

export default Stack;
