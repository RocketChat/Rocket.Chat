import { Field, Select } from '@rocket.chat/fuselage';
import React from 'react';

export const Preferences = ({ name, options, onChange, optionDefault, children, ...props }) => (
	<Field {...props}>
		<Field.Label>{name}</Field.Label>
		<Field.Row>
			<Select onChange={onChange} options={options} value={optionDefault} />
			{children}
		</Field.Row>
	</Field>
);
