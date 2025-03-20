import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

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
		<FieldLabel>{name}</FieldLabel>
		<FieldRow>
			<Select onChange={onChange} options={options} value={optionValue} />
			{children}
		</FieldRow>
	</Field>
);

export default NotificationPreference;
