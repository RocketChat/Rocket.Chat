import type { IContact, Serialized } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Divider, IconButton } from '@rocket.chat/fuselage';
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
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { getEndpointErrorMessage } from '../../lib/errorHandling';

export type ContactEditProps = {
	contact?: Serialized<IContact>;
	onSaved?: (contact: Serialized<IContact>) => void;
	onClose: () => void;
};

type ContactForm = {
	givenName: string;
	surname: string;
	displayName: string;
	emails: { address: string; label: string }[];
	phones: { raw: string; label: string }[];
	companyName: string;
};

/** Same cap the endpoint enforces, so the form cannot build a body the API would reject. */
const MAX_ENTRIES = 10;

const ContactEdit = ({ contact, onSaved, onClose }: ContactEditProps) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();
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
			displayName: contact?.displayName ?? '',
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
		mutationFn: async ({ givenName, surname, displayName, emails, phones, companyName }: ContactForm) => {
			const filledEmails = emails
				.filter(({ address }) => address.trim())
				.map(({ address, label }) => ({ address: address.trim(), ...(label.trim() && { label: label.trim() }) }));

			const filledPhones = phones
				.filter(({ raw }) => raw.trim())
				.map(({ raw, label }) => ({ raw: raw.trim(), ...(label.trim() && { label: label.trim() }) }));

			const fields = {
				givenName,
				...(surname && { surname }),
				...(displayName && { displayName }),
				...(companyName && { companyName }),
				...(filledEmails.length && { emails: filledEmails }),
				...(filledPhones.length && { phones: filledPhones }),
			};

			if (contact) {
				await updateContact({ contactId: contact._id, ...fields });

				return undefined;
			}

			const { contact: created } = await createContact(fields);

			return created;
		},
		onSuccess: async (created) => {
			dispatchToastMessage({ type: 'success', message: t(created ? 'Contact_created' : 'Contact_updated') });

			await queryClient.invalidateQueries({ queryKey: ['contacts', 'list'] });

			if (created && onSaved) {
				onSaved(created);
				return;
			}

			onClose();
		},
		onError: async (error) =>
			dispatchToastMessage({ type: 'error', message: await getEndpointErrorMessage(error, 'Failed_to_save_settings') }),
	});

	return (
		<ContextualbarDialog onClose={onClose}>
			<ContextualbarHeader>
				<ContextualbarIcon name='address-book' />
				<ContextualbarTitle>{contact ? t('Edit_contact') : t('Create_contact')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent is='form' id='contact-form' onSubmit={handleSubmit((data) => save.mutate(data))}>
				<FieldGroup>
					<Field>
						<FieldLabel required>{t('First_name')}</FieldLabel>
						<FieldRow>
							<TextInput {...register('givenName', { required: t('Required_field', { field: t('First_name') }) })} />
						</FieldRow>
						{errors.givenName && <FieldError>{errors.givenName.message}</FieldError>}
					</Field>
					<Field>
						<FieldLabel>{t('Last_name')}</FieldLabel>
						<FieldRow>
							<TextInput {...register('surname')} />
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel>{t('Display_name')}</FieldLabel>
						<FieldRow>
							<TextInput {...register('displayName')} />
						</FieldRow>
					</Field>

					<Divider />

					{emailFields.fields.map((field, index) => (
						<Field key={field.id}>
							<FieldLabel>{t('Email')}</FieldLabel>
							<FieldRow>
								<TextInput {...register(`emails.${index}.address`)} />
								{emailFields.fields.length > 1 && (
									<IconButton
										secondary
										marginInlineStart={4}
										icon='trash'
										aria-label={t('Remove_email')}
										title={t('Remove_email')}
										onClick={() => emailFields.remove(index)}
									/>
								)}
							</FieldRow>
							<FieldLabel>{t('Label')}</FieldLabel>
							<FieldRow>
								<TextInput {...register(`emails.${index}.label`)} />
							</FieldRow>
						</Field>
					))}

					<Field>
						<Box display='flex'>
							<Button
								small
								icon='plus'
								type='button'
								disabled={emailFields.fields.length >= MAX_ENTRIES}
								onClick={() => emailFields.append({ address: '', label: '' })}
							>
								{t('Add_email')}
							</Button>
						</Box>
					</Field>

					<Divider />

					{phoneFields.fields.map((field, index) => (
						<Field key={field.id}>
							<FieldLabel>{t('Phone')}</FieldLabel>
							<FieldRow>
								<TextInput {...register(`phones.${index}.raw`)} />
								{phoneFields.fields.length > 1 && (
									<IconButton
										secondary
										marginInlineStart={4}
										icon='trash'
										aria-label={t('Remove_phone')}
										title={t('Remove_phone')}
										onClick={() => phoneFields.remove(index)}
									/>
								)}
							</FieldRow>
							<FieldLabel>{t('Label')}</FieldLabel>
							<FieldRow>
								<TextInput {...register(`phones.${index}.label`)} />
							</FieldRow>
						</Field>
					))}

					<Field>
						<Box display='flex'>
							<Button
								small
								icon='plus'
								type='button'
								disabled={phoneFields.fields.length >= MAX_ENTRIES}
								onClick={() => phoneFields.append({ raw: '', label: '' })}
							>
								{t('Add_phone')}
							</Button>
						</Box>
					</Field>

					<Divider />

					<Field>
						<FieldLabel>{t('Company')}</FieldLabel>
						<FieldRow>
							<TextInput {...register('companyName')} />
						</FieldRow>
					</Field>

					{!contact && (
						<Box fontScale='c1' color='hint'>
							{t('Information_can_be_edited_later')}
						</Box>
					)}
				</FieldGroup>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button type='button' onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button primary type='submit' form='contact-form' loading={save.isPending}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</ContextualbarDialog>
	);
};

export default ContactEdit;
