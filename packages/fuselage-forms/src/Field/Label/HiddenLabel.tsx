import { FieldLabel as FieldLabelComponent } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import { useFieldLabel } from '../FieldContext';

export type HiddenLabelProps = ComponentProps<typeof FieldLabelComponent>;

const HiddenLabel = ({ children, ...props }: HiddenLabelProps) => {
	const [labelRef] = useFieldLabel();

	return (
		<FieldLabelComponent {...props} ref={labelRef} is='span'>
			{children}
		</FieldLabelComponent>
	);
};

export default HiddenLabel;
