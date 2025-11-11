import { Box, Field, FieldLabel, FieldRow, InputBox } from '@rocket.chat/fuselage';
import { format } from 'date-fns';
import type { ChangeEvent, ReactElement } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

type DatePickerProps = {
	value: Date;
	onChange: (date: Date) => void;
};

const DatePicker = ({ value, onChange }: DatePickerProps): ReactElement => {
	const { t } = useTranslation();
	const fieldId = useId();

	const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
		const [year, month, day] = e.target.value.split('-').map(Number);
		const newDate = new Date(value);
		newDate.setFullYear(year, month - 1, day);
		onChange(newDate);
	};

	const dateValue = value && !isNaN(value.getTime()) ? format(value, 'yyyy-MM-dd') : '';

	return (
		<Box mb='x16'>
			<Field>
				<FieldLabel htmlFor={fieldId}>{t('Date')}</FieldLabel>
				<FieldRow>
					<InputBox id={fieldId} type='date' value={dateValue} onChange={handleDateChange} />
				</FieldRow>
			</Field>
		</Box>
	);
};

export default DatePicker;
