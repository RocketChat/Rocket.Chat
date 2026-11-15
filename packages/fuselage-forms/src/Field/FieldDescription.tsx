import { FieldDescription as FieldDescriptionComponent } from '@rocket.chat/fuselage';
import type { ReactNode, ComponentProps } from 'react';

import { useFieldDescriptorId } from './FieldContext';

export type FieldDescriptionProps = { children: ReactNode } & ComponentProps<typeof FieldDescriptionComponent>;

const FieldDescription = ({ children, ...props }: FieldDescriptionProps) => {
	const id = useFieldDescriptorId('description');

	return (
		<FieldDescriptionComponent {...props} id={id}>
			{children}
		</FieldDescriptionComponent>
	);
};

export default FieldDescription;
