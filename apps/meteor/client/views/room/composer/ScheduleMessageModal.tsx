import type { IMessage, IRoom, IScheduledMessage, Serialized } from '@rocket.chat/core-typings';
import { Box, Field, FieldError, FieldLabel, FieldRow, TextAreaInput } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import DatePicker from '../../../components/message/toolbar/items/actions/Timestamp/TimestampPicker/DatePicker';
import TimePicker from '../../../components/message/toolbar/items/actions/Timestamp/TimestampPicker/TimePicker';
import { roomsQueryKeys } from '../../../lib/queryKeys';

/** Match the server-side bounds, so the modal rejects impossible dates before the round trip. */
const MIN_SCHEDULING_LEAD_MS = 60 * 1000;

const MAX_SCHEDULING_HORIZON_MS = 365 * 24 * 60 * 60 * 1000;

const getDefaultDate = (): Date => {
	const date = new Date();
	date.setMinutes(date.getMinutes() + 30, 0, 0);
	return date;
};

type ScheduleMessageForm = {
	msg: string;
	date: Date;
};

type ScheduleMessageModalProps = {
	rid: IRoom['_id'];
	onClose: () => void;
	/** Initial message text — the composer content when scheduling something new. */
	initialText?: string;
	tmid?: IMessage['_id'];
	tshow?: boolean;
	/** When set, the modal edits this pending message instead of creating a new one. */
	scheduledMessage?: Serialized<IScheduledMessage>;
	onScheduled?: () => void;
};

const ScheduleMessageModal = ({
	rid,
	onClose,
	initialText = '',
	tmid,
	tshow,
	scheduledMessage,
	onScheduled,
}: ScheduleMessageModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const messageFieldId = useId();
	const messageErrorId = useId();
	const dateErrorId = useId();

	const isEditing = Boolean(scheduledMessage);

	const {
		control,
		handleSubmit,
		formState: { errors, isValid },
	} = useForm<ScheduleMessageForm>({
		mode: 'onChange',
		defaultValues: {
			msg: scheduledMessage?.msg ?? initialText,
			date: scheduledMessage ? new Date(scheduledMessage.scheduledAt) : getDefaultDate(),
		},
	});

	const scheduleMessage = useEndpoint('POST', '/v1/chat.scheduleMessage');
	const updateScheduledMessage = useEndpoint('POST', '/v1/chat.updateScheduledMessage');

	const { mutate, isPending } = useMutation({
		mutationFn: async ({ msg, date }: ScheduleMessageForm) => {
			if (scheduledMessage) {
				return updateScheduledMessage({ id: scheduledMessage._id, msg, scheduledAt: date.toISOString() });
			}

			return scheduleMessage({ rid, msg, scheduledAt: date.toISOString(), tmid, tshow });
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: isEditing ? t('Scheduled_message_updated') : t('Message_scheduled') });
			void queryClient.invalidateQueries({ queryKey: roomsQueryKeys.scheduledMessages(rid) });
			onScheduled?.();
			onClose();
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	return (
		<GenericModal
			icon='clock'
			variant='info'
			title={isEditing ? t('Edit_scheduled_message') : t('Schedule_message')}
			confirmText={isEditing ? t('Save') : t('Schedule')}
			confirmDisabled={!isValid || isPending}
			onConfirm={handleSubmit((data) => mutate(data))}
			onCancel={onClose}
			onClose={onClose}
		>
			<Box display='flex' flexDirection='column'>
				<Field>
					<FieldLabel htmlFor={messageFieldId}>{t('Message')}</FieldLabel>
					<FieldRow>
						<Controller
							name='msg'
							control={control}
							rules={{ required: t('Required_field', { field: t('Message') }) }}
							render={({ field }) => (
								<TextAreaInput
									id={messageFieldId}
									rows={3}
									aria-required='true'
									aria-invalid={Boolean(errors.msg)}
									aria-describedby={errors.msg && messageErrorId}
									{...field}
								/>
							)}
						/>
					</FieldRow>
					{errors.msg && <FieldError id={messageErrorId}>{errors.msg.message}</FieldError>}
				</Field>
				<Controller
					name='date'
					control={control}
					rules={{
						validate: (date) => {
							if (date.getTime() < Date.now() + MIN_SCHEDULING_LEAD_MS) {
								return t('Scheduled_date_must_be_in_the_future');
							}

							if (date.getTime() > Date.now() + MAX_SCHEDULING_HORIZON_MS) {
								return t('Scheduled_date_must_be_within_a_year');
							}

							return true;
						},
					}}
					render={({ field }) => (
						<>
							<DatePicker {...field} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date && dateErrorId} />
							<TimePicker {...field} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date && dateErrorId} />
							{errors.date && <FieldError id={dateErrorId}>{errors.date.message}</FieldError>}
						</>
					)}
				/>
			</Box>
		</GenericModal>
	);
};

export default ScheduleMessageModal;
