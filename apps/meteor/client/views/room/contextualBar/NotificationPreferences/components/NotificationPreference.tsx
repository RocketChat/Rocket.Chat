import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, Select, Stack } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useId } from 'react';

export type NotificationPreferenceProps = {
	id: string;
	name: string;
	options: SelectOption[];
	onChange: (e: unknown) => void;
	optionValue: string;
	children?: ReactNode;
};

const NotificationPreference = ({ name, options, onChange, optionValue, children, ...props }: NotificationPreferenceProps) => {
	const selectId = useId();

	return (
		<Field {...props}>
			<FieldLabel htmlFor={selectId}>{name}</FieldLabel>
			<FieldRow>
				<Stack direction='row' grow align='center' gap={children ? 'x4' : undefined}>
					<Select id={selectId} onChange={onChange} options={options} value={optionValue} />
					{children}
				</Stack>
			</FieldRow>
		</Field>
	);
};

export default NotificationPreference;
