import { Box, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type TimePickerProps = {
	selectedDate: Date;
	onChange: (date: Date) => void;
};

const TimePicker = ({ selectedDate, onChange }: TimePickerProps): ReactElement => {
	const { t } = useTranslation();

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
					<input
						type='time'
						value={timeValue}
						onChange={handleTimeChange}
						step='60'
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

export default TimePicker;