import { Box, Field, FieldLabel, FieldRow, InputBox } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from '@rocket.chat/ui-contexts';

type DatePickerProps = {
	selectedDate: Date;
	onChange: (date: Date) => void;
};

const DatePicker = ({ selectedDate, onChange }: DatePickerProps): ReactElement => {
	const t = useTranslation();

	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newDate = new Date(selectedDate);
		const [year, month, day] = e.target.value.split('-').map(Number);
		newDate.setFullYear(year, month - 1, day);
		onChange(newDate);
	};

	return (
		<Box mb='x16'>
			<Field>
				<FieldLabel>{t('Date')}</FieldLabel>
				<FieldRow>
					<InputBox
						type='date'
						value={selectedDate.toISOString().split('T')[0]}
						onChange={handleDateChange}
					/>
				</FieldRow>
			</Field>
		</Box>
	);
};

export default DatePicker;