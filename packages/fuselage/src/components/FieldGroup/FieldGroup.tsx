import type { FieldsetHTMLAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type FieldGroupProps = ElementProps<HTMLFieldSetElement, FieldsetHTMLAttributes<HTMLFieldSetElement>>;

/**
 * A container for grouping fields that semantically share a common data context.
 */
const FieldGroup = (props: FieldGroupProps) => <Box is='fieldset' rcx-field-group role='group' {...props} />;

export default FieldGroup;
