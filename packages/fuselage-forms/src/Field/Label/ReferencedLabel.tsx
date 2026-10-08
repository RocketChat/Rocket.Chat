import { FieldLabel as FieldLabelComponent } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';

import { useFieldLabel } from '../FieldContext';

export type ReferencedLabelProps = ComponentProps<typeof FieldLabelComponent>;

const ReferencedLabel = ({ children, ref, ...props }: ReferencedLabelProps) => {
	const [labelRef, id] = useFieldLabel();
	const mergedRef = useMergedRefs(ref, labelRef);

	return (
		<FieldLabelComponent {...props} ref={mergedRef} htmlFor={id}>
			{children}
		</FieldLabelComponent>
	);
};

export default ReferencedLabel;
