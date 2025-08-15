import { Field, FieldGroup, FieldLabel, FieldRow, FieldError, TextInput, Box, Icon } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import { useEffect, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

// Helper to format date and time for inputs and ISO string for backend
const getDefaultDateTime = () => {
	const now = new Date();
	now.setMinutes(now.getMinutes() + 1); // Round to next minute
	now.setSeconds(0);

	const date = now.toISOString().split('T')[0]; // e.g., "2025-06-06"
	const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`; // e.g., "22:03"

	return { date, time };
};

const combineDateTimeForBackend = (date: string, time: string) => {
	const dateTime = new Date(`${date}T${time}:00`);
	return dateTime.toISOString(); // e.g., "2025-06-06T16:33:00.000Z"
};

// Format the time for display in toast
const formatTime = (dateString: string) => {
	const date = new Date(dateString);
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // e.g., "10:03 PM"
};

type ScheduleFormData = {
	date: string;
	time: string;
};

type ScheduleComposerModalProps = {
	onConfirm: () => void;
	onClose: () => void;
	value: string;
	rid: string;
	tmid?: string; // Thread ID (optional)
	tshow?: boolean; // Show in thread (optional)
	previewUrls?: string[]; // Preview URLs (optional)
	isSlashCommandAllowed?: boolean;
};

const ScheduleComposerModal = ({
	onClose,
	onConfirm,
	value,
	rid,
	tmid,
	tshow,
	previewUrls,
	isSlashCommandAllowed,
}: ScheduleComposerModalProps) => {
	const { t } = useTranslation();
	const dateFieldId = useId();
	const timeFieldId = useId();
	const dateFieldErrorId = useId();
	const timeFieldErrorId = useId();
	const dispatchToastMessage = useToastMessageDispatch();

	// Set default values for date and time
	const { date: defaultDate, time: defaultTime } = getDefaultDateTime();

	const {
		handleSubmit,
		setFocus,
		control,
		formState: { errors },
	} = useForm<ScheduleFormData>({
		mode: 'onBlur',
		defaultValues: {
			date: defaultDate,
			time: defaultTime,
		},
	});

	useEffect(() => {
		setFocus('date');
	}, [setFocus]);

	const onClickConfirm = async ({ date, time }: ScheduleFormData) => {
		// Validate that the message text is not empty
		if (!value.trim()) {
			dispatchToastMessage({
				type: 'error',
				message: t('Message_cannot_be_empty'),
			});
			return;
		}

		const scheduleDate = new Date(`${date}T${time}:00`);
		const currentDate = new Date();

		// Validate that the date is in the future
		if (scheduleDate <= currentDate) {
			dispatchToastMessage({
				type: 'error',
				message: t('Error_Schedule_Date_Must_Be_Future'),
			});
			return;
		}

		// Format the date for the backend (ISO string)
		const scheduledAt = combineDateTimeForBackend(date, time);

		// Log the payload for debugging
		const payload = {
			msg: value,
			scheduledAt,
			rid,
			tmid,
			tshow,
			previewUrls,
			isSlashCommandAllowed,
		};
		console.log('Scheduling message payload:', payload);

		// Make the API call to schedule the message
		try {
			const response = await fetch('/api/v1/chat.scheduleMessage', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Auth-Token': Meteor._localStorage.getItem('Meteor.loginToken') || '',
					'X-User-Id': Meteor.userId() || '',
				},
				body: JSON.stringify(payload),
			});
			const result = await response.json();

			if (result.success) {
				const formattedTime = formatTime(scheduledAt);
				dispatchToastMessage({
					type: 'success',
					message: t(`Message scheduled for ${formattedTime}`),
				});
				onConfirm(); // Notify parent (MessageBox) that scheduling is done
				onClose();
			} else {
				dispatchToastMessage({
					type: 'error',
					message: t('Failed_to_schedule_message'),
				});
			}
		} catch (error) {
			console.error('Failed to schedule message:', error);
			dispatchToastMessage({
				type: 'error',
				message: t('Failed_to_schedule_message'),
			});
		}
	};

	const submit = handleSubmit(onClickConfirm);

	return (
		<GenericModal
			variant='warning'
			icon={<Icon name='clock' size='x20' />}
			confirmText={t('Schedule')}
			onCancel={onClose}
			wrapperFunction={(props) => <Box is='form' onSubmit={(e) => void submit(e)} {...props} />}
			title={t('Schedule_Message')}
		>
			<FieldGroup mbs={16}>
				<Field>
					<FieldLabel htmlFor={dateFieldId}>{t('Schedule_Date')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='date'
							rules={{
								required: t('Field_required'),
							}}
							render={({ field }) => (
								<TextInput
									id={dateFieldId}
									aria-describedby={errors.date ? dateFieldErrorId : undefined}
									min={moment().format('YYYY-MM-DD')}
									{...field}
									{...({ type: 'date' } as any)}
								/>
							)}
						/>
					</FieldRow>
					{errors.date && <FieldError id={dateFieldErrorId}>{errors.date.message}</FieldError>}
				</Field>
				<Field>
					<FieldLabel htmlFor={timeFieldId}>{t('Schedule_Time')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='time'
							rules={{
								required: t('Field_required'),
							}}
							render={({ field }) => (
								<TextInput
									id={timeFieldId}
									aria-describedby={errors.time ? timeFieldErrorId : undefined}
									{...field}
									{...({ type: 'time' } as any)}
								/>
							)}
						/>
					</FieldRow>
					{errors.time && <FieldError id={timeFieldErrorId}>{errors.time.message}</FieldError>}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ScheduleComposerModal;
