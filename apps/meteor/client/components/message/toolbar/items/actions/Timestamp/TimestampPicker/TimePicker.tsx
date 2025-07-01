import { Box, Field, FieldLabel, FieldRow, InputBox } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

type TimePickerProps = {
	selectedDate: Date;
	onChange: (date: Date) => void;
};

const TimePicker = ({ selectedDate, onChange }: TimePickerProps): ReactElement => {
	const t = useTranslation();

	const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newDate = new Date(selectedDate);
		const [hours, minutes] = e.target.value.split(':').map(Number);
		newDate.setHours(hours, minutes);
		onChange(newDate);
	};

	const timeValue = `${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`;

	return (
		<Box mb='x16'>
			<Field>
				<FieldLabel>{t('Time')}</FieldLabel>
				<FieldRow>
					<InputBox type='time' value={timeValue} onChange={handleTimeChange} step='60' />
				</FieldRow>
			</Field>
		</Box>
	);
};

export default TimePicker;
