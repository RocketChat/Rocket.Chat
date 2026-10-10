import { Field as FieldComponent } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

import FieldProvider from './FieldProvider';

export type FieldProps = { children: ReactNode } & ComponentProps<typeof FieldComponent>;

function Field({ children, ...props }: FieldProps) {
	return (
		<FieldProvider>
			<FieldComponent {...props}>{children}</FieldComponent>
		</FieldProvider>
	);
}

export default Field;
