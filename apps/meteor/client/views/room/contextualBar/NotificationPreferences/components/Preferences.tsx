import { Field, Select } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

type PreferencesProps = {
	id: string;
	name: string;
	options: [string, string][];
	onChange: (e: unknown) => void;
	optionDefault: string;
	children?: ReactElement;
};

export const Preferences = ({ name, options, onChange, optionDefault, children, ...props }: PreferencesProps): ReactElement => (
	<Field {...props}>
		<Field.Label>{name}</Field.Label>
		<Field.Row>
			<Select onChange={onChange} options={options} value={optionDefault} />
			{children}
		</Field.Row>
	</Field>
);
