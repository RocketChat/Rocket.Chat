import type { ReactElement } from 'react';
import { useState } from 'react';
import { Box, InputBox, Field, FieldGroup, FieldRow, FieldLabel } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

type MessageBoxScheduleModalProps = {
	onClose: () => void;
	onSchedule: (scheduledAt: Date) => void;
};

export const MessageBoxScheduleModal = ({ onClose, onSchedule }: MessageBoxScheduleModalProps): ReactElement => {
	const { t } = useTranslation();
	
	const now = new Date();
	const tomorrow = new Date(now);
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(tomorrow.getHours() + 1);
	
	const defaultDate = tomorrow.toISOString().split('T')[0];
	const defaultTime = tomorrow.toTimeString().slice(0, 5);
	
	const [date, setDate] = useState(defaultDate);
	const [time, setTime] = useState(defaultTime);
	const [error, setError] = useState('');

	const handleSchedule = () => {
		if (!date || !time) {
			setError(t('Please_select_date_and_time'));
			return;
		}

		const scheduledAt = new Date(`${date}T${time}`);
		const currentTime = new Date();

		if (scheduledAt <= currentTime) {
			setError(t('Scheduled_date_must_be_in_future'));
			return;
		}

		onSchedule(scheduledAt);
	};

	const currentDate = now.toISOString().split('T')[0];
	const currentTime = now.toTimeString().slice(0, 5);
	const minDate = currentDate;
	
	const minTime = date === currentDate ? currentTime : undefined;

	const validateDateTime = (newDate: string, newTime: string) => {
		if (!newDate || !newTime) {
			setError('');
			return;
		}

		const scheduledAt = new Date(`${newDate}T${newTime}`);
		const currentTime = new Date();

		if (scheduledAt <= currentTime) {
			setError(t('Scheduled_date_must_be_in_future'));
		} else {
			setError('');
		}
	};

	return (
		<GenericModal
			variant='warning'
			title={t('Schedule_Message')}
			onClose={onClose}
			onConfirm={handleSchedule}
			onCancel={onClose}
			confirmText={t('Schedule')}
		>
			<FieldGroup mbs={24} w='full'>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Date')}</FieldLabel>
					</FieldRow>
					<FieldRow>
						<InputBox
							type='date'
							value={date}
							min={minDate}
							onChange={(e) => {
								const target = e.target as HTMLInputElement;
								const newDate = target.value;
								setDate(newDate);
								validateDateTime(newDate, time);
							}}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Time')}</FieldLabel>
					</FieldRow>
					<FieldRow>
						<InputBox
							type='time'
							value={time}
							min={minTime}
							onChange={(e) => {
								const target = e.target as HTMLInputElement;
								const newTime = target.value;
								setTime(newTime);
								validateDateTime(date, newTime);
							}}
						/>
					</FieldRow>
				</Field>
				{error && (
					<Box color='danger' fontScale='p2' mts={8}>
						{error}
					</Box>
				)}
			</FieldGroup>
		</GenericModal>
	);
};
