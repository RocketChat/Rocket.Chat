import type { ChangeEvent } from 'react';
import { Box, InputBox } from '@rocket.chat/fuselage';
import { format } from 'date-fns';

type DateTimePickerProps = {
	value: Date;
	onChange: (date: Date) => void;
	error?: boolean;
};

const DateTimePicker = ({ value, onChange, error }: DateTimePickerProps) => {
	const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
		const newDate = new Date(e.target.value);
		if (!isNaN(newDate.getTime())) {
			onChange(newDate);
		}
	};

	const formattedValue = format(value, "yyyy-MM-dd'T'HH:mm");

	return (
		<Box>
			<InputBox type='datetime-local' value={formattedValue} onChange={handleDateChange} min={format(new Date(), "yyyy-MM-dd'T'HH:mm")} error={error ? 'error' : undefined} />
		</Box>
	);
};

export default DateTimePicker;
