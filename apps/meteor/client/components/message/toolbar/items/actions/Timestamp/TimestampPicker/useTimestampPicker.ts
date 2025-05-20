import { useState } from 'react';
import type { TimestampFormat } from '../../../../../../../lib/utils/timestamp/types';
import { dateToTimestamp, generateTimestampMarkup } from '../../../../../../../lib/utils/timestamp/conversion';
import { useChat } from '../../../../../../../views/room/contexts/ChatContext';

export const useTimestampPicker = (_messageId: string) => {
	
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [selectedFormat, setSelectedFormat] = useState<TimestampFormat>('f');
	const chat = useChat();

	const handleDateChange = (date: Date) => {
		// Preserve the time when changing date
		const newDate = new Date(date);
		newDate.setHours(selectedDate.getHours());
		newDate.setMinutes(selectedDate.getMinutes());
		setSelectedDate(newDate);
	};

	const handleTimeChange = (date: Date) => {
		// Preserve the date when changing time
		const newDate = new Date(selectedDate);
		newDate.setHours(date.getHours());
		newDate.setMinutes(date.getMinutes());
		setSelectedDate(newDate);
	};

	const handleFormatChange = (format: TimestampFormat) => {
		setSelectedFormat(format);
	};

	const handleSubmit = () => {
		const timestamp = dateToTimestamp(selectedDate);
		const markup = generateTimestampMarkup(timestamp, selectedFormat);
	
		// Get the current text and cursor position from composer
		if (chat?.composer) {
			const text = chat.composer.text;
			const selection = chat.composer.selection;
			const cursorPosition = selection?.end ?? text.length;
	
			// Insert the timestamp markup at the cursor position
			const newText = text.slice(0, cursorPosition) + markup + text.slice(cursorPosition);
	
			// Update the composer text and set cursor position after the markup
			chat.composer.setText(newText, {
				selection: {
					start: cursorPosition + markup.length,
					end: cursorPosition + markup.length,
				},
			});
		}
	};


	return {
		selectedDate,
		selectedFormat,
		handleDateChange,
		handleTimeChange,
		handleFormatChange,
		handleSubmit,
	};
};