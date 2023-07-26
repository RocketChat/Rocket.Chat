import type { SelectOption } from '@rocket.chat/fuselage';
import {
	Field,
	TextInput,
	TextAreaInput,
	PasswordInput,
	MultiSelectFiltered,
	Box,
	ToggleSwitch,
	Icon,
	Divider,
	FieldGroup,
} from '@rocket.chat/fuselage';
import { CustomFieldsForm } from '@rocket.chat/ui-client';
import { useTranslation, useAccountsCustomFields } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, ReactElement } from 'react';
import React, { useEffect } from 'react';
import type { Control, FieldErrorsImpl, UseFormHandleSubmit, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { ContextualbarScrollableContent } from '../../../components/Contextualbar';

type UserFormValues = {
	name: string;
	username: string;
	email: string;
	verified: boolean;
	statusText: string;
	bio: string;
	nickname: string;
	password: string;
	setRandomPassword: boolean;
	requirePasswordChange: boolean;
	roles: string[];
	customFields: object;
	joinDefaultChannels: boolean;
	sendWelcomeEmail: boolean;
};

type UserFormProps = {
	errors?: FieldErrorsImpl<UserFormValues>;
	formValues?: Record<string, unknown>;
	formHandlers?: Record<string, (eventOrValue: ChangeEvent | unknown) => void>;
	availableRoles?: SelectOption[];
	prepend?: ReactElement;
	append?: ReactElement;
	isSmtpEnabled?: boolean;
	control?: Control<UserFormValues>;
	watch?: UseFormWatch<UserFormValues>;
	handleSubmit?: UseFormHandleSubmit<UserFormValues>;
	register?: UseFormRegister<UserFormValues>;
	setValue?: UseFormSetValue<UserFormValues>;
	onReload: () => void;
};

const UserForm = ({
	errors,
	prepend,
	append,
	isSmtpEnabled,
	control,
	watch,
	register,
	setValue,
	availableRoles,
	...props
}: UserFormProps) => {
	const t = useTranslation();

	const customFieldsMetadata = useAccountsCustomFields();

	useEffect(() => {
		// const subscription = watch?.((value) => setValue?.('customFields', { ...value.customFields }));
		// return () => subscription?.unsubscribe();
	}, [setValue, watch]);

	return (
		<>
			<ContextualbarScrollableContent {...props} autoComplete='off'>
				<FieldGroup>
					{prepend}
					<Field>
						<Field.Label>{t('Name')}</Field.Label>
						<Field.Row>
							<TextInput
								error={errors?.name?.message}
								flexGrow={1}
								{...register?.('name', { required: t('The_field_is_required', t('name')) })}
							/>
						</Field.Row>
						{errors?.name && <Field.Error>{errors.name.message}</Field.Error>}
					</Field>

					<Field>
						<Field.Label>{t('Username')}</Field.Label>
						<Field.Row>
							<TextInput
								error={errors?.username?.message}
								flexGrow={1}
								addon={<Icon name='at' size='x20' />}
								{...register?.('username', { required: t('The_field_is_required', t('username')) })}
							/>
						</Field.Row>
						{errors?.username && <Field.Error>{errors.username.message}</Field.Error>}
					</Field>

					<Field>
						<Field.Label>{t('Email')}</Field.Label>
						<Field.Row>
							<TextInput
								error={errors?.email?.message}
								flexGrow={1}
								addon={<Icon name='mail' size='x20' />}
								{...register?.('email', { required: t('The_field_is_required', t('email')) })}
							/>
						</Field.Row>
						{errors?.email && <Field.Error>{errors.email.message}</Field.Error>}
						<Field.Row>
							<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' mbs='x4'>
								<Box color='default' fontScale='p2m'>
									{t('Verified')}
								</Box>
								<Controller
									control={control}
									name='verified'
									render={({ field: { onChange, value } }) => <ToggleSwitch checked={value} onChange={onChange} />}
								/>
							</Box>
						</Field.Row>
					</Field>

					<Field>
						<Field.Label>{t('StatusMessage')}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} addon={<Icon name='edit' size='x20' />} {...register?.('statusText')} />
						</Field.Row>
					</Field>

					<Field>
						<Field.Label>{t('Bio')}</Field.Label>
						<Field.Row>
							<TextAreaInput rows={3} flexGrow={1} addon={<Icon name='edit' size='x20' alignSelf='center' />} {...register?.('bio')} />
						</Field.Row>
					</Field>

					<Field>
						<Field.Label>{t('Nickname')}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} addon={<Icon name='edit' size='x20' alignSelf='center' />} {...register?.('nickname')} />
						</Field.Row>
					</Field>
				</FieldGroup>

				<FieldGroup is='form' autoComplete='off'>
					{!watch?.('setRandomPassword') && (
						<Field>
							<Field.Label>{t('Password')}</Field.Label>
							<Field.Row>
								<PasswordInput
									{...register?.('password', { required: t('The_field_is_required', { field: t('Password') }) })}
									error={errors?.password?.message}
									flexGrow={1}
									addon={<Icon name='key' size='x20' />}
									autoComplete='new-password'
								/>
							</Field.Row>
							{errors?.password && <Field.Error>{errors.password.message}</Field.Error>}
						</Field>
					)}

					<Field>
						<Field.Row>
							<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
								<Box color='default' fontScale='p2m'>
									{t('Require_password_change')}
								</Box>
								<Controller
									control={control}
									name='requirePasswordChange'
									render={({ field: { onChange, value } }) => (
										<ToggleSwitch
											disabled={watch?.('setRandomPassword')}
											checked={watch?.('setRandomPassword') || value}
											onChange={onChange}
										/>
									)}
								/>
							</Box>
						</Field.Row>
					</Field>

					<Field>
						<Field.Row>
							<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
								<Box color='default' fontScale='p2m'>
									{t('Set_random_password_and_send_by_email')}
								</Box>
								<Controller
									control={control}
									name='setRandomPassword'
									// rules={{ required: t('The_field_is_required', t('password')) }}
									render={({ field: { onChange, value } }) => (
										<ToggleSwitch checked={value} onChange={onChange} disabled={!isSmtpEnabled} />
									)}
								/>
							</Box>
						</Field.Row>
						{!isSmtpEnabled && (
							<Field.Hint dangerouslySetInnerHTML={{ __html: t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' }) }} />
						)}
					</Field>

					<Field>
						<Field.Label>{t('Roles')}</Field.Label>
						<Field.Row>
							<Controller
								control={control}
								name='roles'
								rules={{ required: t('The_field_is_required', t('roles')) }}
								render={({ field: { onChange, value } }) => (
									<MultiSelectFiltered
										value={value}
										onChange={onChange}
										flexGrow={1}
										placeholder={t('Select_an_option')}
										options={availableRoles || []}
									/>
								)}
							/>
						</Field.Row>
						{errors?.roles && <Field.Error>{errors.roles.message}</Field.Error>}
					</Field>

					{/* {handleJoinDefaultChannels && ( */}
					<Field>
						<Field.Row>
							<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
								<Box color='default' fontScale='p2m'>
									{t('Join_default_channels')}
								</Box>
								<Controller
									control={control}
									name='joinDefaultChannels'
									render={({ field: { onChange, value } }) => <ToggleSwitch onChange={onChange} checked={value} />}
								/>
							</Box>
						</Field.Row>
					</Field>
					{/* )} */}

					{/* {handleSendWelcomeEmail && ( */}
					<Field>
						<Field.Row>
							<Box flexGrow={1} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
								<Box color='default' fontScale='p2m'>
									{t('Send_welcome_email')}
								</Box>
								<Controller
									control={control}
									name='sendWelcomeEmail'
									render={({ field: { onChange, value } }) => (
										<ToggleSwitch onChange={onChange} checked={value} disabled={!isSmtpEnabled} />
									)}
								/>
							</Box>
						</Field.Row>
						{!isSmtpEnabled && (
							<Field.Hint dangerouslySetInnerHTML={{ __html: t('Send_Email_SMTP_Warning', { url: 'admin/settings/Email' }) }} />
						)}
					</Field>
					{/* )} */}

					{customFieldsMetadata && (
						<>
							<Divider />
							<Box fontScale='h4'>{t('Custom_Fields')}</Box>
							<CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />
						</>
					)}
				</FieldGroup>
			</ContextualbarScrollableContent>
			{append}
		</>
	);
};

export default UserForm;
