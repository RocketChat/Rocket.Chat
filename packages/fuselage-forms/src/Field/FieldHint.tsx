import { FieldHint as FieldHintComponent } from '@rocket.chat/fuselage';
import type { ReactNode, ComponentProps } from 'react';

import { useFieldDescriptorId } from './FieldContext';

export type FieldHintProps = { children: ReactNode } & ComponentProps<typeof FieldHintComponent>;

const FieldHint = ({ children, ...props }: FieldHintProps) => {
	const id = useFieldDescriptorId('hint');

	return (
		<FieldHintComponent {...props} id={id}>
			{children}
		</FieldHintComponent>
	);
};

export default FieldHint;
