import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { ButtonGroup, Button, IconButton, Divider } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, FieldError, TextInput } from '@rocket.chat/fuselage-forms';
import { validateEmail } from '@rocket.chat/tools';
import {
	CustomFieldsForm,
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarDialog,
	ContextualbarSkeleton,
} from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { Fragment, useId } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AdvancedContactModal from './AdvancedContactModal';
import { useCreateContact } from './hooks/useCreateContact';
import { useEditContact } from './hooks/useEditContact';
import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import { useFormSubmitWithDirtyCheck } from '../../../hooks/useFormSubmitWithDirtyCheck';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { omnichannelQueryKeys } from '../../../lib/queryKeys';
import { ContactManagerInput } from '../additionalForms';
import { useCustomFieldsMetadata } from '../directory/hooks/useCustomFieldsMetadata';

type ContactNewEditProps = {
	contactData?: Serialized<ILivechatContact> | null;
	onClose: () => void;
	onCancel: () => void;
};

type ContactFormData = {
	name: string;
	emails: { address: string }[];
	phones: { phoneNumber: string }[];
	customFields: Record<any, any>;
	contactManager: string;
};

const DEFAULT_VALUES = {
	name: '',
	emails: [],
	phones: [],
	contactManager: '',
	customFields: {},
};

const getInitialValues = (data: ContactNewEditProps['contactData']): ContactFormData => {
	if (!data) {
		return DEFAULT_VALUES;
	}

	const { name, phones, emails, customFields, contactManager } = data ?? {};

	return {
		name: name ?? '',
		emails: emails ?? [],
		phones: phones ?? [],
		customFields: customFields ?? {},
		contactManager: contactManager ?? '',
	};
};

const validateMultipleFields = (fieldsLength: number, hasLicense: boolean) => fieldsLength >= 1 && !hasLicense;

const EditContactInfo = ({ contactData, onClose, onCancel }: ContactNewEditProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const { data: hasLicense = false } = useHasLicenseModule('contact-id-verification');
	const canViewCustomFields = hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	const editContact = useEditContact(['current-contacts']);
	const createContact = useCreateContact(['current-contacts']);
	const checkExistenceEndpoint = useEndpoint('GET', '/v1/omnichannel/contacts.checkExistence');
	const queryClient = useQueryClient();
	const handleOpenUpSellModal = () => setModal(<AdvancedContactModal onCancel={() => setModal(null)} />);

	const { data: customFieldsMetadata = [], isLoading: isLoadingCustomFields } = useCustomFieldsMetadata({
		scope: 'visitor',
		enabled: canViewCustomFields,
	});

	const initialValue = getInitialValues(contactData);

	const {
		formState: { errors, isSubmitting, isDirty },
		control,
		watch,
		handleSubmit,
	} = useForm<ContactFormData>({
		reValidateMode: 'onBlur',
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

	const { emails, phones } = watch();

	const validateEmailFormat = async (emailValue: string) => {
		if (!emails) {
			return true;
		}

		const currentEmails = emails.map(({ address }) => address);

		if (!validateEmail(emailValue)) {
			return t('error-invalid-email-address');
		}

		if (currentEmails.filter((email) => email === emailValue).length > 1) {
			return t('Email_already_exists');
		}

		const initialEmails = initialValue.emails.map(({ address }) => address);

		if (!initialEmails.includes(emailValue) && (await checkExistenceEndpoint({ email: emailValue })).exists) {
			return t('Email_already_exists');
		}

		return true;
	};

	const validatePhone = async (phoneValue: string) => {
		if (!phones) {
			return true;
		}

		const currentPhones = phones.map(({ phoneNumber }) => phoneNumber);

		if (currentPhones.filter((phone) => phone === phoneValue).length > 1) {
			return t('Phone_already_exists');
		}

		const initialPhones = initialValue.phones.map(({ phoneNumber }) => phoneNumber);

		if (!initialPhones.includes(phoneValue) && (await checkExistenceEndpoint({ phone: phoneValue })).exists) {
			return t('Phone_already_exists');
		}

		return true;
	};

	const validateName = (v: string): string | boolean => (!v.trim() ? t('Required_field', { field: t('Name') }) : true);

	const handleSave = useFormSubmitWithDirtyCheck(
		async (data: ContactFormData): Promise<void> => {
			const { name, phones, emails, customFields, contactManager } = data;

			const payload = {
				name,
				phones: phones.map(({ phoneNumber }) => phoneNumber),
				emails: emails.map(({ address }) => address),
				customFields,
				contactManager,
			};

			if (contactData) {
				await editContact.mutateAsync({ contactId: contactData?._id, ...payload });
				await queryClient.invalidateQueries({ queryKey: omnichannelQueryKeys.contacts() });
				return;
			}

			await createContact.mutateAsync(payload);
			await queryClient.invalidateQueries({ queryKey: omnichannelQueryKeys.contacts() });
		},
		{
			isDirty,
		},
	);

	const formId = useId();

	if (isLoadingCustomFields) {
		return <ContextualbarSkeleton onClose={onClose} />;
	}

	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarIcon name={contactData ? 'pencil' : 'user'} />
				<ContextualbarTitle>{contactData ? t('Edit_Contact_Profile') : t('New_contact')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent id={formId} is='form' onSubmit={handleSubmit(handleSave)}>
				<Field>
					<FieldLabel required>{t('Name')}</FieldLabel>
					<FieldRow>
						<Controller
							name='name'
							control={control}
							rules={{ validate: validateName }}
							render={({ field }) => <TextInput {...field} error={errors.name?.message} />}
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
									rules={{
										required: t('Required_field', { field: t('Email') }),
										validate: validateEmailFormat,
									}}
									render={({ field }) => <TextInput {...field} error={errors.emails?.[index]?.address?.message} aria-required='true' />}
								/>
								<IconButton title={t('Remove_email')} small onClick={() => removeEmail(index)} mis={8} icon='trash' />
							</FieldRow>
							{errors.emails?.[index]?.address && <FieldError>{errors.emails?.[index]?.address?.message}</FieldError>}
						</Fragment>
					))}
					<Button
						mbs={8}
						onClick={validateMultipleFields(emailFields.length, hasLicense) ? handleOpenUpSellModal : () => appendEmail({ address: '' })}
					>
						{t('Add_email')}
					</Button>
				</Field>
				<Field>
					<FieldLabel>{t('Phone')}</FieldLabel>
					{phoneFields.map((field, index) => (
						<Fragment key={field.id}>
							<FieldRow>
								<Controller
									name={`phones.${index}.phoneNumber`}
									control={control}
									rules={{
										required: t('Required_field', { field: t('Phone') }),
										validate: validatePhone,
									}}
									render={({ field }) => <TextInput {...field} error={errors.phones?.[index]?.phoneNumber?.message} aria-required='true' />}
								/>
								<IconButton title={t('Remove_phone')} small onClick={() => removePhone(index)} mis={8} icon='trash' />
							</FieldRow>
							{errors.phones?.[index]?.phoneNumber && <FieldError>{errors.phones?.[index]?.phoneNumber?.message}</FieldError>}
						</Fragment>
					))}
					<Button
						mbs={8}
						onClick={
							validateMultipleFields(phoneFields.length, hasLicense) ? handleOpenUpSellModal : () => appendPhone({ phoneNumber: '' })
						}
					>
						{t('Add_phone')}
					</Button>
				</Field>
				<Field>
					<FieldLabel>{t('Contact_Manager')}</FieldLabel>
					<FieldRow>
						<Controller
							name='contactManager'
							control={control}
							render={({ field: { value, onChange } }) => <ContactManagerInput value={value} onChange={onChange} />}
						/>
					</FieldRow>
				</Field>
				<Divider />
				{canViewCustomFields && <CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />}
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button type='submit' form={formId} loading={isSubmitting} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</ContextualbarDialog>
	);
};

export default EditContactInfo;
