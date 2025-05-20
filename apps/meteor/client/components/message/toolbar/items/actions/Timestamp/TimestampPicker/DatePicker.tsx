import { Box, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
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

	return (
		<Box mb='x16'>
			<Field>
				<FieldLabel>{t('Date')}</FieldLabel>
				<FieldRow>
					<input
						type='date'
						value={selectedDate.toISOString().split('T')[0]}
						onChange={handleDateChange}
						style={{
							width: '100%',
							padding: '8px',
							border: '1px solid #e4e4e4',
							borderRadius: '4px',
						}}
					/>
				</FieldRow>
			</Field>
		</Box>
	);
};

export default DatePicker;