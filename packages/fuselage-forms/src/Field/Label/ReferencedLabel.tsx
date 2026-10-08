import { FieldLabel as FieldLabelComponent } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import { useFieldLabel } from '../FieldContext';

export type ReferencedLabelProps = ComponentProps<typeof FieldLabelComponent>;

const ReferencedLabel = ({ children, ...props }: ReferencedLabelProps) => {
	const [labelRef, id] = useFieldLabel();

	return (
		<FieldLabelComponent {...props} ref={labelRef} htmlFor={id}>
			{children}
		</FieldLabelComponent>
	);
};

export default ReferencedLabel;
