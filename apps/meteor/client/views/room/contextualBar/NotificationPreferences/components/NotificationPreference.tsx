import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, Select } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

type NotificationPreferenceProps = {
	id: string;
	name: string;
	options: SelectOption[];
	onChange: (e: unknown) => void;
	optionValue: string;
	children?: ReactElement;
};

const NotificationPreference = ({
	name,
	options,
	onChange,
	optionValue,
	children,
	...props
}: NotificationPreferenceProps): ReactElement => (
	<Field {...props}>
		<Field.Label>{name}</Field.Label>
		<Field.Row>
			<Select onChange={onChange} options={options} value={optionValue} />
			{children}
		</Field.Row>
	</Field>
);

export default NotificationPreference;
