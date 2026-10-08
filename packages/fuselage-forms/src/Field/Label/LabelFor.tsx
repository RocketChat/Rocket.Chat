import { FieldLabel as FieldLabelComponent } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import { useFieldLabel } from '../FieldContext';

export type LabelForProps = ComponentProps<typeof FieldLabelComponent>;

const LabelFor = ({ children, ...props }: LabelForProps) => {
	const [labelRef, id] = useFieldLabel();
	return (
		<FieldLabelComponent {...props} ref={labelRef} id={id} is='span'>
			{children}
		</FieldLabelComponent>
	);
};

export default LabelFor;
