import type { IContact, Serialized } from '@rocket.chat/core-typings';
import {
	Box,
	Button,
	ButtonGroup,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalHeaderText,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { Field, FieldError, FieldGroup, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage-forms';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { getEndpointErrorMessage } from '../../lib/errorHandling';

type ContactModalProps = {
	contact?: Serialized<IContact>;
	onCreated?: (contact: Serialized<IContact>) => void;
	onClose: () => void;
};

type ContactForm = {
	givenName: string;
	surname: string;
	displayName: string;
	emails: { address: string }[];
	phones: { raw: string }[];
	companyName: string;
};

/** Same cap the endpoint enforces, so the form cannot build a body the API would reject. */
const MAX_ENTRIES = 10;

const ContactModal = ({ contact, onCreated, onClose }: ContactModalProps) => {
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
			emails: contact?.emails.length ? contact.emails.map(({ address }) => ({ address })) : [{ address: '' }],
			phones: contact?.phones.length ? contact.phones.map(({ raw }) => ({ raw })) : [{ raw: '' }],
			companyName: contact?.companyName ?? '',
		},
	});

	const emailFields = useFieldArray({ control, name: 'emails' });
	const phoneFields = useFieldArray({ control, name: 'phones' });

	const save = useMutation({
		mutationFn: async ({ givenName, surname, displayName, emails, phones, companyName }: ContactForm) => {
			const filledEmails = emails.filter(({ address }) => address.trim()).map(({ address }) => ({ address: address.trim() }));
			const filledPhones = phones.filter(({ raw }) => raw.trim()).map(({ raw }) => ({ raw: raw.trim() }));

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

			if (created) {
				onCreated?.(created);
			}

			onClose();
		},
		onError: async (error) =>
			dispatchToastMessage({ type: 'error', message: await getEndpointErrorMessage(error, 'Failed_to_save_settings') }),
	});

	return (
		<Modal wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit((data) => save.mutate(data))} {...props} />}>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>{contact ? t('Edit_contact') : t('Create_contact')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
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

					{emailFields.fields.map((field, index) => (
						<Field key={field.id}>
							<FieldLabel>{t('Email')}</FieldLabel>
							<FieldRow>
								<TextInput {...register(`emails.${index}.address`)} />
							</FieldRow>
							{index > 0 && (
								<FieldRow>
									<ButtonGroup stretch>
										<Button small type='button' aria-label={t('Remove_email')} onClick={() => emailFields.remove(index)}>
											{t('Remove')}
										</Button>
									</ButtonGroup>
								</FieldRow>
							)}
							{index === emailFields.fields.length - 1 && (
								<FieldRow>
									<ButtonGroup stretch>
										<Button
											type='button'
											disabled={emailFields.fields.length >= MAX_ENTRIES}
											onClick={() => emailFields.append({ address: '' })}
										>
											{t('Add_email')}
										</Button>
									</ButtonGroup>
								</FieldRow>
							)}
						</Field>
					))}

					{phoneFields.fields.map((field, index) => (
						<Field key={field.id}>
							<FieldLabel>{t('Phone')}</FieldLabel>
							<FieldRow>
								<TextInput {...register(`phones.${index}.raw`)} />
							</FieldRow>
							{index > 0 && (
								<FieldRow>
									<ButtonGroup stretch>
										<Button small type='button' aria-label={t('Remove_phone')} onClick={() => phoneFields.remove(index)}>
											{t('Remove')}
										</Button>
									</ButtonGroup>
								</FieldRow>
							)}
							{index === phoneFields.fields.length - 1 && (
								<FieldRow>
									<ButtonGroup stretch>
										<Button
											type='button'
											disabled={phoneFields.fields.length >= MAX_ENTRIES}
											onClick={() => phoneFields.append({ raw: '' })}
										>
											{t('Add_phone')}
										</Button>
									</ButtonGroup>
								</FieldRow>
							)}
						</Field>
					))}

					<Field>
						<FieldLabel>{t('Company')}</FieldLabel>
						<FieldRow>
							<TextInput {...register('companyName')} />
						</FieldRow>
					</Field>
				</FieldGroup>
			</ModalContent>
			<ModalFooter>
				<Box is='div' display='flex' justifyContent='space-between' alignItems='center' width='full'>
					<Box fontScale='c1' color='hint'>
						{!contact && t('Information_can_be_edited_later')}
					</Box>
					<ButtonGroup align='end'>
						<Button type='button' onClick={onClose}>
							{t('Cancel')}
						</Button>
						<Button primary type='submit' loading={save.isPending}>
							{t('Save')}
						</Button>
					</ButtonGroup>
				</Box>
			</ModalFooter>
		</Modal>
	);
};

export default ContactModal;
