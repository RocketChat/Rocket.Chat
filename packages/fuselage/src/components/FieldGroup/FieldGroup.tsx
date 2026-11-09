import type { FieldsetHTMLAttributes } from 'react';

import { appendClassName } from '../../helpers/appendClassName.js';
import { patchChildren } from '../../helpers/patchChildren.js';
import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type FieldGroupProps = ElementProps<HTMLFieldSetElement, FieldsetHTMLAttributes<HTMLFieldSetElement>>;

/**
 * A container for grouping fields that semantically share a common data context.
 */
const FieldGroup = ({ children, ...props }: FieldGroupProps) => (
	<Box is='fieldset' rcx-field-group role='group' {...props}>
		{patchChildren(children, (childProps: { className: string | string[] }) => ({
			className: appendClassName(childProps.className, 'rcx-field-group__item'),
		}))}
	</Box>
);

export default FieldGroup;
