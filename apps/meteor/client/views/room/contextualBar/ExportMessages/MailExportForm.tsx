import type { IRoom } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
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
	Box,
	Icon,
	Callout,
	FieldGroup,
	Select,
} from '@rocket.chat/fuselage';
import { useAutoFocus, useMutableCallback, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { UserAutoCompleteMultiple } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect, useContext } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { validateEmail } from '../../../../../lib/emailValidator';
import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../../components/Contextualbar';
import { SelectedMessageContext, useCountSelected } from '../../MessageList/contexts/SelectedMessagesContext';
import type { MailExportFormValues } from './ExportMessages';
import { useRoomExportMutation } from './useRoomExportMutation';

type MailExportFormProps = {
	formId: string;
	rid: IRoom['_id'];
	onCancel: () => void;
	exportOptions: SelectOption[];
};

const MailExportForm = ({ formId, rid, onCancel, exportOptions }: MailExportFormProps) => {
	const t = useTranslation();
	const formFocus = useAutoFocus<HTMLFormElement>();

	const {
		watch,
		setValue,
		control,
		register,
		formState: { errors, isDirty, isSubmitting },
		handleSubmit,
		clearErrors,
	} = useFormContext<MailExportFormValues>();
	const roomExportMutation = useRoomExportMutation();

	const { selectedMessageStore } = useContext(SelectedMessageContext);
	const messages = selectedMessageStore.getSelectedMessages();

	const count = useCountSelected();

	const clearSelection = useMutableCallback(() => {
		selectedMessageStore.clearStore();
	});

	useEffect(() => {
		selectedMessageStore.setIsSelecting(true);
		return (): void => {
			selectedMessageStore.reset();
		};
	}, [selectedMessageStore]);

	const { toUsers } = watch();

	useEffect(() => {
		setValue('messagesCount', messages.length);
	}, [setValue, messages.length]);

	const handleExport = async ({ type, toUsers, subject, additionalEmails }: MailExportFormValues) => {
		roomExportMutation.mutateAsync({
			rid,
			type,
			toUsers,
			toEmails: additionalEmails?.split(','),
			subject,
			messages,
		});
	};

	const clickable = css`
		cursor: pointer;
	`;

	const methodField = useUniqueId();
	const toUsersField = useUniqueId();
	const additionalEmailsField = useUniqueId();
	const subjectField = useUniqueId();

	return (
		<>
			<ContextualbarScrollableContent>
				<form ref={formFocus} tabIndex={-1} aria-labelledby={`${formId}-title`} id={formId} onSubmit={handleSubmit(handleExport)}>
					<FieldGroup>
						<Field>
							<FieldLabel htmlFor={methodField}>{t('Method')}</FieldLabel>
							<FieldRow>
								<Controller
									name='type'
									control={control}
									render={({ field }) => <Select id={methodField} {...field} placeholder={t('Type')} options={exportOptions} />}
								/>
							</FieldRow>
						</Field>
						<Field>
							<Callout onClick={clearSelection} title={t('Messages_selected')} type={count > 0 ? 'success' : 'info'}>
								<p>{`${count} Messages selected`}</p>
								{count > 0 && (
									<Box is='p' className={clickable}>
										{t('Click_here_to_clear_the_selection')}
									</Box>
								)}
								{count === 0 && <Box is='p'>{t('Click_the_messages_you_would_like_to_send_by_email')}</Box>}
							</Callout>
							<input
								type='hidden'
								{...register('messagesCount', {
									validate: (messagesCount) => (messagesCount > 0 ? undefined : t('Mail_Message_No_messages_selected_select_all')),
								})}
							/>
							{errors.messagesCount && <FieldError aria-live='assertive'>{errors.messagesCount.message}</FieldError>}
						</Field>
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

												if (additionalEmails !== '' && validateEmail(additionalEmails)) {
													return undefined;
												}

												return t('Mail_Message_Invalid_emails', additionalEmails);
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
								<FieldError aria-live='assertive' id={`${additionalEmailsField}-error`}>
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
									render={({ field }) => <TextAreaInput rows={3} id={subjectField} {...field} addon={<Icon name='edit' size='x20' />} />}
								/>
							</FieldRow>
						</Field>
					</FieldGroup>
				</form>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button loading={isSubmitting} disabled={!isDirty} form={formId} primary type='submit'>
						{t('Send')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default MailExportForm;
