import { Box, Field, FieldLabel, FieldRow, InputBox } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type DatePickerProps = {
	selectedDate: Date;
	onChange: (date: Date) => void;
};

const DatePicker = ({ selectedDate, onChange }: DatePickerProps): ReactElement => {
	const { t } = useTranslation();

	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newDate = new Date(selectedDate);
		const [year, month, day] = e.target.value.split('-').map(Number);
		newDate.setFullYear(year, month - 1, day);
		onChange(newDate);
	};

	const yyyy = selectedDate.getFullYear();
	const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
	const dd = String(selectedDate.getDate()).padStart(2, '0');
	const dateValue = `${yyyy}-${mm}-${dd}`;

	return (
		<Box mb='x16'>
			<Field>
				<FieldLabel>{t('Date')}</FieldLabel>
				<FieldRow>
					<InputBox type='date' value={dateValue} onChange={handleDateChange} />
				</FieldRow>
			</Field>
		</Box>
	);
};

export default DatePicker;
