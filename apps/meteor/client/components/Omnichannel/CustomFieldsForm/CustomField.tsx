import { Field } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

export const CustomField: FC<{ data: { label: string; required: boolean } }> = ({ children, data: { label, required } }) => (
	<Field>
		<Field.Label>
			{label}
			{required && '*'}
		</Field.Label>
		<Field.Row>{children}</Field.Row>
	</Field>
);
