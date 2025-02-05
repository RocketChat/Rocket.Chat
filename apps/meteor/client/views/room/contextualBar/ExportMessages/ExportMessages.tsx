import type { SelectOption } from '@rocket.chat/fuselage';
import {
	FieldError,
	Field,
	FieldLabel,
	FieldRow,
	TextAreaInput,
	TextInput,
	ButtonGroup,
	Button,
	Icon,
	FieldGroup,
	Select,
	InputBox,
	Callout,
} from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useContext, useEffect, useId, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useDownloadExportMutation } from './useDownloadExportMutation';
import { useRoomExportMutation } from './useRoomExportMutation';
import { validateEmail } from '../../../../../lib/emailValidator';
import {
	ContextualbarHeader,
	ContextualbarScrollableContent,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarFooter,
} from '../../../../components/Contextualbar';
import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { SelectedMessageContext, useCountSelected } from '../../MessageList/contexts/SelectedMessagesContext';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

export type ExportMessagesFormValues = {
	type: 'email' | 'file' | 'download';
	dateFrom: string;
	dateTo: string;
	format: 'html' | 'json';
	toUsers: string[];
	additionalEmails: string;
	messagesCount: number;
	subject: string;
};

const ExportMessages = () => {
	const { t } = useTranslation();
	const { closeTab } = useRoomToolbox();
	const formFocus = useAutoFocus<HTMLFormElement>();
	const room = useRoom();
	const isE2ERoom = room.encrypted;

	const roomName = room?.t && roomCoordinator.getRoomName(room.t, room);

	const {
		control,
		formState: { errors, isSubmitting },
		watch,
		register,
		setValue,
		handleSubmit,
		clearErrors,
	} = useForm<ExportMessagesFormValues>({
		mode: 'onBlur',
		defaultValues: {
			type: isE2ERoom ? 'download' : 'email',
			dateFrom: '',
			dateTo: '',
			toUsers: [],
			additionalEmails: '',
			messagesCount: 0,
			subject: t('Mail_Messages_Subject', {
				postProcess: 'sprintf',
				sprintf: [roomName],
			}),
			format: isE2ERoom ? 'json' : 'html',
		},
	});

	const exportOptions = useMemo<SelectOption[]>(
		() => [
			['email', t('Send_email')],
			['file', t('Send_file_via_email')],
			['download', t('Download_file')],
		],
		[t],
	);

	const outputOptions = useMemo<SelectOption[]>(
		() => [
			['html', t('HTML')],
			['json', t('JSON')],
		],
		[t],
	);

	const roomExportMutation = useRoomExportMutation();
	const downloadExportMutation = useDownloadExportMutation();

	const { selectedMessageStore } = useContext(SelectedMessageContext);
	const messageCount = useCountSelected();

	const { type, toUsers } = watch();

	useEffect(() => {
		if (type !== 'file') {
			selectedMessageStore.setIsSelecting(true);
		}

		return (): void => {
			selectedMessageStore.reset();
		};
	}, [type, selectedMessageStore]);

	useEffect(() => {
		if (type === 'email') {
			setValue('format', 'html');
		}

		if (type === 'download') {
			setValue('format', 'json');
		}

		setValue('messagesCount', messageCount);
	}, [type, setValue, messageCount]);

	const handleExport = async ({ type, toUsers, dateFrom, dateTo, format, subject, additionalEmails }: ExportMessagesFormValues) => {
		const messages = selectedMessageStore.getSelectedMessages();

		if (type === 'download') {
			return downloadExportMutation.mutateAsync({
				mids: messages,
			});
		}

		if (type === 'file') {
			return roomExportMutation.mutateAsync({
				rid: room._id,
				type: 'file',
				...(dateFrom && { dateFrom }),
				...(dateTo && { dateTo }),
				format,
			});
		}

		roomExportMutation.mutateAsync({
			rid: room._id,
			type: 'email',
			toUsers,
			toEmails: additionalEmails?.split(','),
			subject,
			messages,
		});
	};

	const formId = useId();
	const methodField = useId();
	const formatField = useId();
	const toUsersField = useId();
	const dateFromField = useId();
	const dateToField = useId();
	const additionalEmailsField = useId();
	const subjectField = useId();

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='mail' />
				<ContextualbarTitle id={`${formId}-title`}>{t('Export_Messages')}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<form ref={formFocus} tabIndex={-1} aria-labelledby={`${formId}-title`} id={formId} onSubmit={handleSubmit(handleExport)}>
					<FieldGroup>
						{room.createdOTR && (
							<Field>
								<Callout role='alert' type='warning'>
									{t('OTR_messages_cannot_be_exported')}
								</Callout>
							</Field>
						)}
						<Field>
							<FieldLabel htmlFor={methodField}>{t('Method')}</FieldLabel>
							<FieldRow>
								<Controller
									name='type'
									control={control}
									render={({ field }) => (
										<Select id={methodField} {...field} placeholder={t('Type')} disabled={isE2ERoom} options={exportOptions} />
									)}
								/>
							</FieldRow>
						</Field>
						<Field>
							<FieldLabel htmlFor={formatField}>{t('Output_format')}</FieldLabel>
							<FieldRow>
								<Controller
									name='format'
									control={control}
									render={({ field }) => (
										<Select
											{...field}
											id={formatField}
											disabled={type === 'email' || type === 'download'}
											placeholder={t('Format')}
											options={outputOptions}
										/>
									)}
								/>
							</FieldRow>
						</Field>
						{type === 'file' && (
							<>
								<Field>
									<FieldLabel htmlFor={dateFromField}>{t('Date_From')}</FieldLabel>
									<FieldRow>
										<Controller
											name='dateFrom'
											control={control}
											render={({ field }) => <InputBox id={dateFromField} type='date' {...field} />}
										/>
									</FieldRow>
								</Field>
								<Field>
									<FieldLabel htmlFor={dateToField}>{t('Date_to')}</FieldLabel>
									<FieldRow>
										<Controller
											name='dateTo'
											control={control}
											render={({ field }) => <InputBox id={dateToField} {...field} type='date' />}
										/>
									</FieldRow>
								</Field>
							</>
						)}
						{type === 'email' && (
							<>
								<Field>
									<FieldLabel htmlFor={toUsersField}>{t('To_users')}</FieldLabel>
									<FieldRow>
										<Controller
											name='toUsers'
											control={control}
											render={({ field: { value, onChange, onBlur, name } }) => (
												<UserAutoCompleteMultiple
													id={toUsersField}
													value={value}
													onChange={(value) => {
														onChange(value);
														clearErrors('additionalEmails');
													}}
													onBlur={onBlur}
													name={name}
												/>
											)}
										/>
									</FieldRow>
								</Field>
								<Field>
									<FieldLabel htmlFor={additionalEmailsField}>{t('To_additional_emails')}</FieldLabel>
									<FieldRow>
										<Controller
											name='additionalEmails'
											control={control}
											rules={{
												validate: {
													validateEmail: (additionalEmails) => {
														if (additionalEmails === '') {
															return undefined;
														}

														const emails = additionalEmails?.split(',').map((email) => email.trim());
														if (Array.isArray(emails) && emails.every((email) => validateEmail(email.trim()))) {
															return undefined;
														}

														return t('Mail_Message_Invalid_emails', { postProcess: 'sprintf', sprintf: [additionalEmails] });
													},
													validateToUsers: (additionalEmails) => {
														if (additionalEmails !== '' || toUsers?.length > 0) {
															return undefined;
														}

														return t('Mail_Message_Missing_to');
													},
												},
											}}
											render={({ field }) => (
												<TextInput
													id={additionalEmailsField}
													{...field}
													placeholder={t('Email_Placeholder_any')}
													addon={<Icon name='mail' size='x20' />}
													aria-describedby={`${additionalEmailsField}-error`}
													aria-invalid={Boolean(errors?.additionalEmails?.message)}
													error={errors?.additionalEmails?.message}
												/>
											)}
										/>
									</FieldRow>
									{errors?.additionalEmails && (
										<FieldError role='alert' id={`${additionalEmailsField}-error`}>
											{errors.additionalEmails.message}
										</FieldError>
									)}
								</Field>
								<Field>
									<FieldLabel htmlFor={subjectField}>{t('Subject')}</FieldLabel>
									<FieldRow>
										<Controller
											name='subject'
											control={control}
											render={({ field }) => (
												<TextAreaInput rows={3} id={subjectField} {...field} addon={<Icon name='edit' size='x20' />} />
											)}
										/>
									</FieldRow>
								</Field>
							</>
						)}
						{type !== 'file' && (
							<>
								<input
									type='hidden'
									{...register('messagesCount', {
										validate: (messagesCount) => (messagesCount > 0 ? undefined : t('Mail_Message_No_messages_selected_select_all')),
									})}
								/>
								{errors.messagesCount && (
									<Field>
										<Callout role='alert' type='danger'>
											{errors.messagesCount.message}
										</Callout>
									</Field>
								)}
							</>
						)}
					</FieldGroup>
				</form>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={closeTab}>{t('Cancel')}</Button>
					<Button loading={isSubmitting} form={formId} primary type='submit'>
						{type === 'download' ? t('Download') : t('Send')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default ExportMessages;
