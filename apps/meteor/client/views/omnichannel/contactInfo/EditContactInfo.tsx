import type { ILivechatVisitor, Serialized } from '@rocket.chat/core-typings';
import { Field, FieldLabel, FieldRow, FieldError, TextInput, ButtonGroup, Button, IconButton, Divider } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { CustomFieldsForm } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useState, useEffect, Fragment } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import { validateEmail } from '../../../../lib/emailValidator';
import {
	ContextualbarScrollableContent,
	ContextualbarContent,
	ContextualbarFooter,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
} from '../../../components/Contextualbar';
import { createToken } from '../../../lib/utils/createToken';
import { ContactManager as ContactManagerForm } from '../additionalForms';
import { FormSkeleton } from '../directory/components/FormSkeleton';
import { useCustomFieldsMetadata } from '../directory/hooks/useCustomFieldsMetadata';
import { useContactRoute } from '../hooks/useContactRoute';

type ContactNewEditProps = {
	id: string;
	contactData?: { contact: Serialized<ILivechatVisitor> | null };
	onClose: () => void;
	onCancel: () => void;
};

type ContactFormData = {
	token: string;
	name: string;
	emails: { address: string }[];
	phones: { phoneNumber: string }[];
	username: string;
	customFields: Record<any, any>;
};

const DEFAULT_VALUES = {
	token: '',
	name: '',
	emails: [],
	phones: [],
	username: '',
	customFields: {},
};

const getInitialValues = (data: ContactNewEditProps['contactData']): ContactFormData => {
	if (!data) {
		return DEFAULT_VALUES;
	}

	const { name, token, phone, visitorEmails, livechatData, contactManager } = data.contact ?? {};

	return {
		token: token ?? '',
		name: name ?? '',
		emails: visitorEmails ?? [],
		phones: phone ?? [],
		customFields: livechatData ?? {},
		username: contactManager?.username ?? '',
	};
};

// TODO: Add group select input
const EditContactInfo = ({ id, contactData, onClose, onCancel }: ContactNewEditProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const handleNavigate = useContactRoute();

	const canViewCustomFields = hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	const [userId, setUserId] = useState('no-agent-selected');
	const saveContact = useEndpoint('POST', '/v1/omnichannel/contact');
	const getContactBy = useEndpoint('GET', '/v1/omnichannel/contact.search');
	const getUserData = useEndpoint('GET', '/v1/users.info');

	const { data: customFieldsMetadata = [], isInitialLoading: isLoadingCustomFields } = useCustomFieldsMetadata({
		scope: 'visitor',
		enabled: canViewCustomFields,
	});

	const initialValue = getInitialValues(contactData);
	const { username: initialUsername } = initialValue;

	const {
		formState: { errors, isSubmitting },
		control,
		setValue,
		handleSubmit,
		setError,
	} = useForm<ContactFormData>({
		mode: 'onChange',
		reValidateMode: 'onChange',
		defaultValues: initialValue,
	});

	const {
		fields: emailFields,
		append: appendEmail,
		remove: removeEmail,
	} = useFieldArray({
		control,
		name: 'emails',
	});

	const {
		fields: phoneFields,
		append: appendPhone,
		remove: removePhone,
	} = useFieldArray({
		control,
		name: 'phones',
	});

	useEffect(() => {
		if (!initialUsername) {
			return;
		}

		getUserData({ username: initialUsername }).then(({ user }) => {
			setUserId(user._id);
		});
	}, [getUserData, initialUsername]);

	const validateEmailFormat = (email: string): boolean | string => {
		if (!email || email === initialValue.email) {
			return true;
		}

		if (!validateEmail(email)) {
			return t('error-invalid-email-address');
		}

		return true;
	};

	const validateContactField = async (name: 'phone' | 'email', value: string, optional = true) => {
		if ((optional && !value) || value === initialValue[name]) {
			return true;
		}

		const query = { [name]: value } as Record<'phone' | 'email', string>;
		const { contact } = await getContactBy(query);
		return !contact || contact._id === id;
	};

	const validateName = (v: string): string | boolean => (!v.trim() ? t('The_field_is_required', t('Name')) : true);

	const handleContactManagerChange = async (userId: string): Promise<void> => {
		setUserId(userId);

		if (userId === 'no-agent-selected') {
			setValue('username', '', { shouldDirty: true });
			return;
		}

		const { user } = await getUserData({ userId });
		setValue('username', user.username || '', { shouldDirty: true });
	};

	const validateAsync = async ({ phone = '', email = '' } = {}) => {
		const isEmailValid = await validateContactField('email', email);
		const isPhoneValid = await validateContactField('phone', phone);

		!isEmailValid && setError('email', { message: t('Email_already_exists') });
		!isPhoneValid && setError('phone', { message: t('Phone_already_exists') });

		return isEmailValid && isPhoneValid;
	};

	const handleSave = async (data: ContactFormData): Promise<void> => {
		console.log(data);
		return;
		if (!(await validateAsync(data))) {
			return;
		}

		const { name, phone, email, customFields, username, token } = data;

		const payload = {
			name,
			phone,
			email,
			customFields,
			token: token || createToken(),
			...(username && { contactManager: { username } }),
			...(id && { _id: id }),
		};

		try {
			await saveContact(payload);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			await queryClient.invalidateQueries({ queryKey: ['current-contacts'] });
			contactData ? handleNavigate({ context: 'details' }) : handleNavigate({ tab: 'contacts', context: '' });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const nameField = useUniqueId();
	const phoneField = useUniqueId();

	if (isLoadingCustomFields) {
		return (
			<ContextualbarContent>
				<FormSkeleton />
			</ContextualbarContent>
		);
	}

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name={contactData ? 'pencil' : 'user'} />
				<ContextualbarTitle>{contactData ? t('Edit_Contact_Profile') : t('New_contact')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent is='form' onSubmit={handleSubmit(handleSave)}>
				<Field>
					<FieldLabel htmlFor={nameField} required>
						{t('Name')}
					</FieldLabel>
					<FieldRow>
						<Controller
							name='name'
							control={control}
							rules={{ validate: validateName }}
							render={({ field }) => <TextInput id={nameField} {...field} error={errors.name?.message} />}
						/>
					</FieldRow>
					{errors.name && <FieldError>{errors.name.message}</FieldError>}
				</Field>
				<Field>
					<FieldLabel>{t('Email')}</FieldLabel>
					{emailFields.map((field, index) => (
						<Fragment key={field.id}>
							<FieldRow>
								<Controller
									name={`emails.${index}.address`}
									control={control}
									rules={{ required: t('The_field_is_required', t('Email')), validate: validateEmailFormat }}
									render={({ field }) => <TextInput {...field} error={errors.emails?.[index]?.address?.message} />}
								/>
								<IconButton small onClick={() => removeEmail(index)} mis={8} icon='trash' />
							</FieldRow>
							{errors.emails?.[index]?.address && <FieldError>{errors.emails?.[index]?.address?.message}</FieldError>}
						</Fragment>
					))}
					<Button mbs={8} onClick={() => appendEmail({ address: '' })}>{t('Add_email')}</Button>
				</Field>
				<Field>
					<FieldLabel>{t('Phone')}</FieldLabel>
					{phoneFields.map((field, index) => (
						<Fragment key={field.id}>
							<FieldRow>
								<Controller
									name={`phones.${index}.phoneNumber`}
									control={control}
									rules={{ required: t('The_field_is_required', t('Phone')) }}
									render={({ field }) => <TextInput {...field} error={errors.phones?.[index]?.message} />}
								/>
								<IconButton small onClick={() => removePhone(index)} mis={8} icon='trash' />
							</FieldRow>
							{errors.phones?.[index]?.phoneNumber && <FieldError>{errors.phones?.[index]?.phoneNumber?.message}</FieldError>}
							<FieldError>{errors.phones?.[index]?.message}</FieldError>
						</Fragment>
					))}
					<Button mbs={8} onClick={() => appendPhone({ phoneNumber: '' })}>{t('Add_phone')}</Button>
				</Field>
				<ContactManagerForm value={userId} handler={handleContactManagerChange} />
				<Divider />
				{canViewCustomFields && <CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />}
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button onClick={handleSubmit(handleSave)} loading={isSubmitting} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default EditContactInfo;
