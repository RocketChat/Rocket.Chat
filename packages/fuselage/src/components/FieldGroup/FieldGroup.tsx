import { appendClassName } from '../../helpers/appendClassName';
import { patchChildren } from '../../helpers/patchChildren';
import { Box, type BoxProps } from '../Box';

export type FieldGroupProps = BoxProps;

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
