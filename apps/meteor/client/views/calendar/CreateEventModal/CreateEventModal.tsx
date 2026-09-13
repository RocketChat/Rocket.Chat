import { 
	Box,
	Button, 
	ButtonGroup, 
	Field, 
	FieldLabel, 
	FieldRow, 
	FieldError, 
	TextInput, 
	TextAreaInput, 
	Select, 
	ToggleSwitch, 
	Modal, 
	ModalHeader, 
	ModalTitle, 
	ModalClose, 
	ModalContent, 
	ModalFooter 
} from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';

type CreateEventModalProps = {
	onClose: () => void;
};

type CreateEventFormValues = {
	subject: string;
	description?: string;
	startTime: string;
	endTime?: string;
	meetingUrl?: string;
	reminderMinutesBeforeStart?: string;
	busy: boolean;
};

const CreateEventModal = ({ onClose }: CreateEventModalProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const createEvent = useEndpoint('POST', '/v1/calendar-events.create');

	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isValid, isSubmitting },
	} = useForm<CreateEventFormValues>({
		mode: 'onChange',
		defaultValues: {
			busy: true,
			reminderMinutesBeforeStart: '15',
		},
	});

	const onSubmit = async (data: CreateEventFormValues) => {
		try {
			await createEvent({
				subject: data.subject,
				description: data.description || undefined,
				startTime: new Date(data.startTime).toISOString(),
				endTime: data.endTime ? new Date(data.endTime).toISOString() : undefined,
				meetingUrl: data.meetingUrl || undefined,
				reminderMinutesBeforeStart: data.reminderMinutesBeforeStart ? parseInt(data.reminderMinutesBeforeStart, 10) : undefined,
				busy: data.busy,
			});

			dispatchToastMessage({ type: 'success', message: t('Event_Created_Successfully') });
			queryClient.invalidateQueries({ queryKey: ['calendar', 'list'] });
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const reminderOptions: [string, string][] = [
		['0', t('At_time_of_event')],
		['5', t('5_minutes_before')],
		['10', t('10_minutes_before')],
		['15', t('15_minutes_before')],
		['30', t('30_minutes_before')],
		['60', t('1_hour_before')],
	];

	return (
		<Modal wrapperFunction={(wrapper) => <form onSubmit={handleSubmit(onSubmit)}>{wrapper}</form>}>
			<ModalHeader>
				<ModalTitle>{t('Create_Event')}</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Field mbe={24}>
					<FieldLabel required>{t('Subject')}</FieldLabel>
					<FieldRow>
						<TextInput
							placeholder={t('Event_Subject')}
							{...register('subject', { required: t('Field_required') })}
							error={errors.subject?.message}
						/>
					</FieldRow>
					{errors.subject && <FieldError>{errors.subject.message}</FieldError>}
				</Field>

				<Field mbe={24}>
					<FieldLabel required>{t('Start_Time')}</FieldLabel>
					<FieldRow>
						<TextInput
							type='datetime-local'
							{...register('startTime', { required: t('Field_required') })}
							error={errors.startTime?.message}
						/>
					</FieldRow>
					{errors.startTime && <FieldError>{errors.startTime.message}</FieldError>}
				</Field>

				<Field mbe={24}>
					<FieldLabel>{t('End_Time')}</FieldLabel>
					<FieldRow>
						<TextInput
							type='datetime-local'
							{...register('endTime')}
						/>
					</FieldRow>
				</Field>

				<Field mbe={24}>
					<FieldLabel>{t('Meeting_URL')}</FieldLabel>
					<FieldRow>
						<TextInput
							type='url'
							placeholder='https://...'
							{...register('meetingUrl')}
						/>
					</FieldRow>
				</Field>

				<Field mbe={24}>
					<FieldLabel>{t('Description')}</FieldLabel>
					<FieldRow>
						<TextAreaInput
							rows={3}
							{...register('description')}
						/>
					</FieldRow>
				</Field>

				<Field mbe={24}>
					<FieldLabel>{t('Reminder')}</FieldLabel>
					<FieldRow>
						<Controller
							name='reminderMinutesBeforeStart'
							control={control}
							render={({ field }) => <Select {...field} options={reminderOptions} />}
						/>
					</FieldRow>
				</Field>

				<Field mbe={16}>
					<Box display='flex' alignItems='center'>
						<FieldLabel mbe={0}>{t('Show_as_busy')}</FieldLabel>
						<Controller
							name='busy'
							control={control}
							render={({ field }) => (
								<ToggleSwitch
									checked={field.value}
									onChange={field.onChange}
								/>
							)}
						/>
					</Box>
				</Field>
			</ModalContent>
			<ModalFooter>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary type='submit' loading={isSubmitting} disabled={!isValid}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ModalFooter>
		</Modal>
	);
};

export default CreateEventModal;
