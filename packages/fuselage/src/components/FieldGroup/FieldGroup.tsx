import { styled, Text, type GetProps } from '@tamagui/web';
import type { FieldsetHTMLAttributes } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { patchChildren } from '../../helpers/patchChildren';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { labelBoxDefaults } from '../Label/Label';

const FieldGroupFrame = styled(Text, {
	render: 'fieldset',
	...labelBoxDefaults,
	display: 'flex',
	flexDirection: 'column',
	flexWrap: 'nowrap',
	justifyContent: 'center',
	alignItems: 'stretch',
	minWidth: 0,
	margin: 0,
	padding: 0,
});

export type FieldGroupProps = ElementProps<HTMLFieldSetElement, FieldsetHTMLAttributes<HTMLFieldSetElement>>;

/**
 * A container for grouping fields that semantically share a common data context.
 */
const FieldGroup = ({ children, className, ...props }: FieldGroupProps) => (
	<FieldGroupFrame
		role='group'
		className={['rcx-field-group', className].filter(Boolean).join(' ')}
		{...(props as GetProps<typeof FieldGroupFrame>)}
	>
		{patchChildren(children, (childProps: { className: string | string[] }) => ({
			className: appendClassName(childProps.className, 'rcx-field-group__item'),
		}))}
	</FieldGroupFrame>
);

export default withFuselageProvider(FieldGroup);
