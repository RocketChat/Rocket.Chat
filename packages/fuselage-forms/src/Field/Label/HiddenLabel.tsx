import { FieldLabel as FieldLabelComponent } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';

import { useFieldLabel } from '../FieldContext';

export type HiddenLabelProps = ComponentProps<typeof FieldLabelComponent>;

const HiddenLabel = ({ children, ref, ...props }: HiddenLabelProps) => {
	const [labelRef] = useFieldLabel();
	const mergedRef = useMergedRefs(ref, labelRef);

	return (
		<FieldLabelComponent {...props} ref={mergedRef} is='span'>
			{children}
		</FieldLabelComponent>
	);
};

export default HiddenLabel;
