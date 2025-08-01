import { Box, Field, FieldLabel, FieldRow, InputBox } from '@rocket.chat/fuselage';
import { format } from 'date-fns';
import type { ChangeEvent, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type TimePickerProps = {
	value: Date;
	onChange: (date: Date) => void;
};

const TimePicker = ({ value, onChange }: TimePickerProps): ReactElement => {
	const { t } = useTranslation();

	const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
		const newDate = new Date(value);
		const [hours, minutes] = e.target.value.split(':').map(Number);
		newDate.setHours(hours, minutes, 0, 0);
		onChange(newDate);
	};

	const timeValue = value && !isNaN(value.getTime()) ? format(value, 'HH:mm') : '';

	return (
		<Box mb='x16'>
			<Field>
				<FieldLabel>{t('Time')}</FieldLabel>
				<FieldRow>
					<InputBox type='time' value={timeValue} onChange={handleTimeChange} />
				</FieldRow>
			</Field>
		</Box>
	);
};

export default TimePicker;
