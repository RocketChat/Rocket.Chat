import type { IOutboundProviderMetadata, Serialized, ILivechatContact } from '@rocket.chat/core-typings';
import { Box, Button, Field, FieldError, FieldGroup, FieldHint, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useId, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { useTimeFromNow } from '../../../../../../hooks/useTimeFromNow';
import { formatPhoneNumber } from '../../../../../../lib/formatPhoneNumber';
import AutoCompleteContact from '../../../../../AutoCompleteContact';
import { findLastChatFromChannel } from '../../../utils/findLastChatFromChannel';
import AutoCompleteOutboundProvider from '../../AutoCompleteOutboundProvider';
import RecipientSelect from '../../RecipientSelect';
import SenderSelect from '../../SenderSelect';
import RetryButton from '../components/RetryButton';
import { useFormKeyboardSubmit } from '../hooks/useFormKeyboardSubmit';
import { cxp } from '../utils/cx';
import { FormFetchError } from '../utils/errors';

export type RecipientFormData = {
	contactId: string;
	providerId: string;
	recipient: string;
	sender: string;
};

export type RecipientFormSubmitPayload = {
	contactId: string;
	contact: Serialized<ILivechatContact>;
	providerId: string;
	provider: IOutboundProviderMetadata;
	recipient: string;
	sender: string;
};

type RecipientFormProps = {
	defaultValues?: Partial<RecipientFormData>;
	onDirty?(): void;
	onSubmit(values: RecipientFormSubmitPayload): void;
	renderActions?(state: { isSubmitting: boolean }): ReactNode;
};

const RecipientForm = (props: RecipientFormProps) => {
	const { defaultValues, renderActions, onDirty, onSubmit } = props;
	const getTimeFromNow = useTimeFromNow(true);

	const { trigger, control, handleSubmit, formState, clearErrors } = useForm<RecipientFormData>({
		mode: 'onChange',
		reValidateMode: 'onChange',
		defaultValues: {
			contactId: defaultValues?.contactId ?? '',
			providerId: defaultValues?.providerId ?? '',
			recipient: defaultValues?.recipient ?? '',
			sender: defaultValues?.sender ?? '',
		},
	});

	const { errors, isDirty, isSubmitting } = formState;

	const recipientFormId = useId();

	const [contactId, providerId, recipient] = useWatch({
		name: ['contactId', 'providerId', 'recipient'],
		control,
	});
	const { t } = useTranslation();

	const getContact = useEndpoint('GET', '/v1/omnichannel/contacts.get');
	const getProvider = useEndpoint('GET', '/v1/omnichannel/outbound/providers/:id/metadata', { id: providerId });

	const customActions = useMemo(() => renderActions?.({ isSubmitting }), [isSubmitting, renderActions]);

	const {
		data: provider,
		isError: isErrorProvider,
		isFetching: isFetchingProvider,
		refetch: refetchProvider,
	} = useQuery({
		queryKey: ['outbound-message', 'provider', providerId],
		queryFn: () => getProvider(),
		select: (data) => data?.metadata,
		enabled: !!providerId,
		initialData: undefined,
	});

	const {
		data: contact,
		isError: isErrorContact,
		isFetching: isFetchingContact,
		refetch: refetchContact,
	} = useQuery({
		queryKey: ['outbound-message', 'contact', contactId],
		queryFn: () => getContact({ contactId }),
		select: (data) => data?.contact || null,
		enabled: !!contactId,
		initialData: null,
	});

	const providerLastChat = useMemo(() => {
		return findLastChatFromChannel(contact?.channels, providerId);
	}, [contact?.channels, providerId]);

	useEffect(() => {
		isErrorContact && trigger('contactId');
		return () => clearErrors('contactId');
	}, [clearErrors, isErrorContact, trigger]);

	useEffect(() => {
		isErrorProvider && trigger('providerId');
		return () => clearErrors('providerId');
	}, [clearErrors, isErrorProvider, trigger]);

	// validate recipient field when contact changes
	useEffect(() => {
		contact && trigger('recipient');
	}, [contact, trigger]);

	// validate sender field when provider changes
	useEffect(() => {
		provider && trigger('sender');
	}, [provider, trigger]);

	useEffect(() => {
		isDirty && onDirty?.();
	}, [isDirty, onDirty]);

	const submit = useEffectEvent(async (values: RecipientFormData) => {
		// Wait if contact or provider is still being fetched in background
		const [updatedContact, updatedProvider] = await Promise.all([
			isFetchingContact ? refetchContact().then((r) => r.data) : Promise.resolve(contact),
			isFetchingProvider ? refetchProvider().then((r) => r.data) : Promise.resolve(provider),
		]);

		if (!updatedContact) {
			throw new FormFetchError('error-contact-not-found');
		}

		if (!updatedProvider) {
			throw new FormFetchError('error-provider-not-found');
		}

		onSubmit({ ...values, provider: updatedProvider, contact: updatedContact });
	});

	const formRef = useFormKeyboardSubmit(() => handleSubmit(submit)(), [submit, handleSubmit]);

	return (
		<form ref={formRef} id={recipientFormId} onSubmit={handleSubmit(submit)} noValidate>
			<FieldGroup>
				<Field>
					<FieldLabel is='span' required id={`${recipientFormId}-contact`}>
						{t('Contact')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='contactId'
							rules={{
								required: t('Required_field', { field: t('Contact') }),
								validate: () => (isErrorContact ? t('Error_loading__name__information', { name: t('contact') }) : true),
							}}
							render={({ field }) => (
								<AutoCompleteContact
									aria-labelledby={`${recipientFormId}-contact`}
									aria-describedby={errors.contactId && `${recipientFormId}-contact-error`}
									aria-invalid={!!errors.contactId}
									placeholder={t('Select_recipient')}
									value={field.value}
									onChange={field.onChange}
									error={errors.contactId?.message}
									optionFormatter={({ name, _id, phones = [] }) => ({
										label: name || _id,
										value: _id,
										description: phones.length ? `(${phones.map((p) => formatPhoneNumber(p.phoneNumber)).join(', ')})` : '',
									})}
								/>
							)}
						/>
					</FieldRow>
					{errors.contactId && (
						<FieldError aria-live='assertive' id={`${recipientFormId}-contact-error`} display='flex' alignItems='center'>
							{errors.contactId.message}
							{isErrorContact && <RetryButton loading={isFetchingContact} onClick={refetchContact} />}
						</FieldError>
					)}
				</Field>
				<Field>
					<FieldLabel is='span' required id={`${recipientFormId}-channel`}>
						{t('Channel')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='providerId'
							rules={{
								required: !!contactId && t('Required_field', { field: t('Channel') }),
								validate: () => (isErrorProvider ? t('Error_loading__name__information', { name: t('channel') }) : true),
							}}
							render={({ field }) => (
								<AutoCompleteOutboundProvider
									contact={contact}
									aria-labelledby={`${recipientFormId}-channel`}
									aria-invalid={!!errors.providerId}
									aria-describedby={cxp(recipientFormId, {
										'channel-error': !!errors.providerId,
										'channel-hint': !!provider,
									})}
									error={errors.providerId?.message}
									disabled={!contactId}
									placeholder={t('Select_channel')}
									value={field.value}
									onChange={field.onChange}
								/>
							)}
						/>
					</FieldRow>
					{errors.providerId && (
						<FieldError aria-live='assertive' id={`${recipientFormId}-channel-error`} display='flex' alignItems='center'>
							{errors.providerId.message}
							{isErrorProvider && <RetryButton loading={isFetchingProvider} onClick={refetchProvider} />}
						</FieldError>
					)}
					{providerLastChat && (
						<FieldHint id={`${recipientFormId}-channel-hint`}>
							{t('Last_contact__time__', { time: getTimeFromNow(providerLastChat) })}
						</FieldHint>
					)}
				</Field>
				<Field>
					<FieldLabel is='span' required id={`${recipientFormId}-recipient`}>
						{t('To')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='recipient'
							rules={{
								validate: {
									noPhoneNumber: () => !contactId || !contact || !!contact.phones?.length,
									required: (value) => (!!providerId && !value?.trim() ? t('Required_field', { field: t('To') }) : true),
								},
							}}
							render={({ field }) => (
								<RecipientSelect
									contact={contact}
									type={provider?.providerType || 'phone'}
									aria-busy={isFetchingContact}
									aria-labelledby={`${recipientFormId}-recipient`}
									aria-describedby={errors.recipient && `${recipientFormId}-recipient-error`}
									aria-invalid={!!errors.recipient}
									error={errors.recipient && 'error'}
									placeholder={isFetchingContact ? t('Loading...') : t('Contact_detail')}
									value={field.value}
									disabled={!providerId}
									onChange={field.onChange}
								/>
							)}
						/>
					</FieldRow>
					{errors.recipient?.type === 'required' && (
						<FieldError aria-live='assertive' id={`${recipientFormId}-recipient-error`}>
							{errors.recipient.message}
						</FieldError>
					)}
					{errors.recipient?.type === 'noPhoneNumber' && (
						<FieldError aria-live='assertive' id={`${recipientFormId}-recipient-error`}>
							<Trans i18nKey='No_phone_number_yet_edit_contact'>
								No phone number yet <a href={`/omnichannel-directory/contacts/edit/${contact?._id}`}>Edit contact</a>
							</Trans>
						</FieldError>
					)}
				</Field>
				<Field>
					<FieldLabel is='span' required id={`${recipientFormId}-sender`}>
						{t('From')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='sender'
							rules={{
								validate: {
									noPhoneNumber: () =>
										!!provider && !Object.keys(provider.templates).length ? t('No_phone_number_available_for_selected_channel') : true,
									required: (value) => (!!recipient && !value?.trim() ? t('Required_field', { field: t('From') }) : true),
								},
							}}
							render={({ field }) => (
								<SenderSelect
									provider={provider}
									aria-busy={isFetchingContact}
									aria-labelledby={`${recipientFormId}-sender`}
									aria-describedby={errors.sender && `${recipientFormId}-sender-error`}
									aria-invalid={!!errors.sender}
									error={errors.sender?.message}
									disabled={!recipient}
									placeholder={isFetchingProvider ? t('Loading...') : t('Workspace_detail')}
									value={field.value}
									onChange={field.onChange}
								/>
							)}
						/>
					</FieldRow>
					{errors.sender && (
						<FieldError aria-live='assertive' id={`${recipientFormId}-sender-error`}>
							{errors.sender.message}
						</FieldError>
					)}
				</Field>
			</FieldGroup>

			{customActions ?? (
				<Box mbs={24} display='flex' justifyContent='end'>
					<Button type='submit' primary loading={isSubmitting}>
						{t('Submit')}
					</Button>
				</Box>
			)}
		</form>
	);
};

RecipientForm.displayName = 'RecipientForm';

export default RecipientForm;
