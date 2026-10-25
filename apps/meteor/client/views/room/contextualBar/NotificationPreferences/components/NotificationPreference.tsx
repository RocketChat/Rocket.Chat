import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Field, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type NotificationPreferenceProps = {
	id: string;
	name: string;
	options: SelectOption[];
	onChange: (e: unknown) => void;
	optionValue: string;
	children?: ReactNode;
};

const NotificationPreference = ({ name, options, onChange, optionValue, children, ...props }: NotificationPreferenceProps) => (
	<Field {...props}>
		<FieldLabel>{name}</FieldLabel>
		<FieldRow>
			<Box display='flex' flexGrow={1} alignItems='center' gap={children ? 4 : undefined}>
				<Select onChange={onChange} options={options} value={optionValue} />
				{children}
			</Box>
		</FieldRow>
	</Field>
);

export default NotificationPreference;
