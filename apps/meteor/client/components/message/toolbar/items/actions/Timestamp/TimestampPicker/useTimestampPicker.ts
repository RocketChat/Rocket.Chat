import { useState } from 'react';

import type { ComposerAPI } from '../../../../../../../lib/chats/ChatAPI';
import { dateToTimestamp, generateTimestampMarkup } from '../../../../../../../lib/utils/timestamp/conversion';
import type { TimestampFormat, TimezoneKey } from '../../../../../../../lib/utils/timestamp/types';

export const useTimestampPicker = (composer?: ComposerAPI) => {
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [selectedFormat, setSelectedFormat] = useState<TimestampFormat>('f');
	const [selectedTimezone, setSelectedTimezone] = useState<TimezoneKey>('utc');

	const handleDateChange = (date: Date) => {
		const newDate = new Date(date);
		newDate.setHours(selectedDate.getHours());
		newDate.setMinutes(selectedDate.getMinutes());
		setSelectedDate(newDate);
	};

	const handleTimeChange = (date: Date) => {
		const newDate = new Date(selectedDate);
		newDate.setHours(date.getHours());
		newDate.setMinutes(date.getMinutes());
		setSelectedDate(newDate);
	};

	const handleFormatChange = (format: TimestampFormat) => {
		setSelectedFormat(format);
	};

	const handleTimezoneChange = (timezone: TimezoneKey) => {
		setSelectedTimezone(timezone);
	};

	const handleSubmit = () => {
		const timestamp = dateToTimestamp(selectedDate, selectedTimezone);
		const markup = generateTimestampMarkup(timestamp, selectedFormat);

		if (composer) {
			composer.insertText(markup);
		}
	};

	return {
		selectedDate,
		selectedFormat,
		selectedTimezone,
		handleDateChange,
		handleTimeChange,
		handleFormatChange,
		handleTimezoneChange,
		handleSubmit,
	};
};
