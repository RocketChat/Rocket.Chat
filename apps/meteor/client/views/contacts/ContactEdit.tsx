import type { IContactPublic, Serialized } from '@rocket.chat/core-typings';
import { Button, ButtonGroup, Divider, Icon, IconButton, Stack, Text } from '@rocket.chat/fuselage';
import { Field, FieldError, FieldGroup, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage-forms';
import {
	ContextualbarClose,
	ContextualbarDialog,
	ContextualbarFooter,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarScrollableContent,
	ContextualbarTitle,
} from '@rocket.chat/ui-client';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { isContactNotFoundError } from './lib/isContactNotFoundError';
import { getErrorMessage } from '../../lib/errorHandling';
import { contactsQueryKeys } from '../../lib/queryKeys';

export type ContactEditProps = {
	contact?: Serialized<IContactPublic>;
	onSaved: (contact: Serialized<IContactPublic>) => void;
	onClose: () => void;
};

type ContactForm = {
	givenName: string;
	surname: string;
	emails: { address: string; label: string }[];
	phones: { raw: string; label: string }[];
	companyName: string;
};

/** Same cap the endpoint enforces, so the form cannot build a body the API would reject. */
const MAX_ENTRIES = 10;

const toContactPayload = ({ givenName, surname, emails, phones, companyName }: ContactForm) => {
	const filledEmails = emails
		.filter(({ address }) => address.trim())
		.map(({ address, label }) => ({ address: address.trim(), ...(label.trim() && { label: label.trim() }) }));

	const filledPhones = phones
		.filter(({ raw }) => raw.trim())
		.map(({ raw, label }) => ({ raw: raw.trim(), ...(label.trim() && { label: label.trim() }) }));

	return {
		givenName,
		...(surname && { surname }),
		...(companyName && { companyName }),
		...(filledEmails.length && { emails: filledEmails }),
		...(filledPhones.length && { phones: filledPhones }),
	};
};

const ContactEdit = ({ contact, onSaved, onClose }: ContactEditProps) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();
	const contactFormId = useId();
	const createContact = useEndpoint('POST', '/v1/contacts.create');
	const updateContact = useEndpoint('POST', '/v1/contacts.update');

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<ContactForm>({
		defaultValues: {
			givenName: contact?.givenName ?? '',
			surname: contact?.surname ?? '',
			emails: contact?.emails.length
				? contact.emails.map(({ address, label }) => ({ address, label: label ?? '' }))
				: [{ address: '', label: '' }],
			phones: contact?.phones.length ? contact.phones.map(({ raw, label }) => ({ raw, label: label ?? '' })) : [{ raw: '', label: '' }],
			companyName: contact?.companyName ?? '',
		},
	});

	const emailFields = useFieldArray({ control, name: 'emails' });
	const phoneFields = useFieldArray({ control, name: 'phones' });

	const save = useMutation({
		mutationFn: async (form: ContactForm) => {
			const fields = toContactPayload(form);

			if (contact) {
				const { contact: updated } = await updateContact({ contactId: contact._id, ...fields });

				return { saved: updated, created: false };
			}

			const { contact: created } = await createContact(fields);

			return { saved: created, created: true };
		},
		onSuccess: async ({ saved, created }) => {
			dispatchToastMessage({ type: 'success', message: t(created ? 'Contact_created' : 'Contact_updated') });

			await queryClient.invalidateQueries({ queryKey: contactsQueryKeys.all });

			onSaved(saved);
		},
		onError: async (error) => {
			if (!isContactNotFoundError(error)) {
				dispatchToastMessage({ type: 'error', message: getErrorMessage(error, 'Failed_to_save_settings') });
				return;
			}

			dispatchToastMessage({ type: 'error', message: t('Contact_not_found') });

			onClose();

			await queryClient.invalidateQueries({ queryKey: contactsQueryKeys.all });
		},
	});

	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarIcon name='address-book' />
				<ContextualbarTitle>{contact ? t('Edit_contact') : t('Create_contact')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent is='form' id={contactFormId} onSubmit={handleSubmit((data) => save.mutate(data))}>
				<FieldGroup>
					<Field>
						<FieldLabel required>{t('First_name')}</FieldLabel>
						<FieldRow>
							<TextInput
								aria-required='true'
								error={errors.givenName?.message}
								{...register('givenName', {
									validate: (value) => value.trim().length > 0 || t('Required_field', { field: t('First_name') }),
								})}
							/>
						</FieldRow>
						{errors.givenName && <FieldError>{errors.givenName.message}</FieldError>}
					</Field>
					<Field>
						<FieldLabel>{t('Last_name')}</FieldLabel>
						<FieldRow>
							<TextInput {...register('surname')} />
						</FieldRow>
					</Field>
					<Divider />
					{emailFields.fields.map((field, index) => (
						<Field key={field.id}>
							<FieldLabel>{t('Email')}</FieldLabel>
							<FieldRow>
								<Stack direction='row' align='center' grow gap='x4'>
									<TextInput {...register(`emails.${index}.address`)} />
									{emailFields.fields.length > 1 && (
										<IconButton
											variant='secondary'
											icon={<Icon name='trash' size='x20' />}
											aria-label={t('Remove_email')}
											title={t('Remove_email')}
											onClick={() => emailFields.remove(index)}
										/>
									)}
								</Stack>
							</FieldRow>
							<FieldLabel>{t('Label')}</FieldLabel>
							<FieldRow>
								<TextInput {...register(`emails.${index}.label`)} />
							</FieldRow>
						</Field>
					))}
					<Field>
						<ButtonGroup>
							<Button
								size='small'
								icon='plus'
								type='button'
								disabled={emailFields.fields.length >= MAX_ENTRIES}
								onClick={() => emailFields.append({ address: '', label: '' })}
							>
								{t('Add_email')}
							</Button>
						</ButtonGroup>
					</Field>
					<Divider />
					{phoneFields.fields.map((field, index) => (
						<Field key={field.id}>
							<FieldLabel>{t('Phone')}</FieldLabel>
							<FieldRow>
								<Stack direction='row' align='center' grow gap='x4'>
									<TextInput {...register(`phones.${index}.raw`)} />
									{phoneFields.fields.length > 1 && (
										<IconButton
											variant='secondary'
											icon={<Icon name='trash' size='x20' />}
											aria-label={t('Remove_phone')}
											title={t('Remove_phone')}
											onClick={() => phoneFields.remove(index)}
										/>
									)}
								</Stack>
							</FieldRow>
							<FieldLabel>{t('Label')}</FieldLabel>
							<FieldRow>
								<TextInput {...register(`phones.${index}.label`)} />
							</FieldRow>
						</Field>
					))}
					<Field>
						<ButtonGroup>
							<Button
								size='small'
								icon='plus'
								type='button'
								disabled={phoneFields.fields.length >= MAX_ENTRIES}
								onClick={() => phoneFields.append({ raw: '', label: '' })}
							>
								{t('Add_phone')}
							</Button>
						</ButtonGroup>
					</Field>
					<Divider />
					<Field>
						<FieldLabel>{t('Company')}</FieldLabel>
						<FieldRow>
							<TextInput {...register('companyName')} />
						</FieldRow>
					</Field>
					{!contact && (
						<Text is='p' fontScale='c1' color='hint'>
							{t('Information_can_be_edited_later')}
						</Text>
					)}
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button type='button' onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button variant='primary' type='submit' form={contactFormId} loading={save.isPending}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</ContextualbarDialog>
	);
};

export default ContactEdit;
