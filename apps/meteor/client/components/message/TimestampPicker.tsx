import React, { useState, useCallback, useMemo, ChangeEvent } from 'react';
import {
    Modal,
    Button,
    ButtonGroup,
    Field,
    FieldLabel,
    FieldRow,
    Select,
    Margins,
    Box,
    Callout,
    FieldGroup,
    InputBox,
    type SelectOption, 
} from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import TimeInput from './TimeInput';

import { generateTimestampMarkup, formatTimestamp, dateToTimestamp, timestampToDate } from '../../lib/utils/timestamp/conversion';
import { TIMESTAMP_FORMATS } from '../../lib/utils/timestamp/formats';
import type { TimestampFormat } from '../../lib/utils/timestamp/types';
import { isValidDateRange } from '../../lib/utils/timestamp/validation';

type TimestampPickerProps = {
    onClose: () => void;
    onInsert: (markup: string) => void;
    initialDate?: Date;
};

const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const TimestampPicker = ({ onClose, onInsert, initialDate = new Date() }: TimestampPickerProps) => {
    const t = useTranslation();
    const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
    const [selectedTime, setSelectedTime] = useState<string>(`${initialDate.getHours().toString().padStart(2, '0')}:${initialDate.getMinutes().toString().padStart(2, '0')}`);
    const [selectedFormat, setSelectedFormat] = useState<TimestampFormat>('f');
    const [error, setError] = useState<string | null>(null);

    const formatOptions: SelectOption[] = useMemo(() =>
        Object.entries(TIMESTAMP_FORMATS).map(([key, config]): SelectOption => [key, `${config.label} (${config.description})`]),
    [TIMESTAMP_FORMATS]);

    const handleDateChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        // Adding time ensures the date isn't affected by UTC conversion issues in some browsers
        const newDate = new Date(event.currentTarget.value + 'T00:00:00');
        if (!isNaN(newDate.getTime())) {
            setSelectedDate(newDate);
        }
    }, []);

    const handleInsert = useCallback(() => {
        setError(null);
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const dateTime = new Date(selectedDate);
        dateTime.setHours(hours, minutes, 0, 0);

        if (!isValidDateRange(dateTime)) {
            setError('Selected date is too far in the past or future.');
            return;
        }

        try {
            const timestamp = dateToTimestamp(dateTime);
            const markup = generateTimestampMarkup(timestamp, selectedFormat);
            onInsert(markup);
            onClose();
        } catch (e) {
            console.error("Error generating timestamp markup:", e);
            setError('Could not generate timestamp. Please check the date and time.');
        }
    }, [selectedDate, selectedTime, selectedFormat, onInsert, onClose, t]);

    const previewDate = useMemo(() => {
        try {
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const date = new Date(selectedDate);
            date.setHours(hours, minutes, 0, 0);
            if (!isValidDateRange(date)) {
                return 'Preview unavailable: Date out of range';
            }
            const consistentDate = timestampToDate(dateToTimestamp(date));
            return formatTimestamp(consistentDate, selectedFormat);
        } catch {
            return 'Preview unavailable: Invalid date/time'; 
        }
    }, [selectedDate, selectedTime, selectedFormat]);

    return (
        <Modal>
            <Modal.Header>
                <Modal.Title>Insert Timestamp</Modal.Title> 
                <Modal.Close onClick={onClose} />
            </Modal.Header>
            <Modal.Content>
                <FieldGroup>
                    <Field>
                        <FieldLabel>Date</FieldLabel> 
                        <FieldRow>
                            <InputBox
                                type="date"
                                value={formatDateForInput(selectedDate)}
                                onChange={handleDateChange}
                            />
                        </FieldRow>
                    </Field>
                    <Field>
                        <FieldLabel>Time</FieldLabel> 
                        <FieldRow>
                            <TimeInput value={selectedTime} onChange={setSelectedTime} />
                        </FieldRow>
                    </Field>
                    <Field>
                        <FieldLabel>Format</FieldLabel> 
                        <FieldRow>
                            <Select
                                value={selectedFormat}
                                onChange={(value) => setSelectedFormat(value as TimestampFormat)}
                                options={formatOptions} 
                                placeholder='Select Format' 
                            />
                        </FieldRow>
                    </Field>
                    <Field>
                        <FieldLabel>Preview</FieldLabel> 
                        <Box is='span' fontScale='p2' color='hint'>{previewDate}</Box>
                    </Field>
                    {error && <Margins blockStart='x16'><Callout type='danger'>{error}</Callout></Margins>}
                </FieldGroup>
            </Modal.Content>
            <Modal.Footer>
                <ButtonGroup align='end'>
                    <Button onClick={onClose}>Cancel</Button> 
                    <Button primary onClick={handleInsert}>Insert</Button> 
                </ButtonGroup>
            </Modal.Footer>
        </Modal>
    );
};

export default TimestampPicker;
