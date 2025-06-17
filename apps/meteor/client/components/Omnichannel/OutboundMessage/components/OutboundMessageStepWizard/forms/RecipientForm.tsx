import type { IOutboundProviderMetadata, Serialized, ILivechatContact } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldGroup, FieldHint, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { forwardRef, useEffect, useId, useImperativeHandle } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { formatPhoneNumber } from '../../../../../../lib/formatPhoneNumber';
import AutoCompleteContact from '../../../../../AutoCompleteContact';
import { getProviderMetadataMock } from '../../../mocks';
import AutoCompleteOutboundProvider from '../../AutoCompleteOutboundProvider';
import RecipientSelect from '../../RecipientSelect';
import SenderSelect from '../../SenderSelect';
import RetryButton from '../components/RetryButton';
import { createSubmitHandler } from '../utils/createSubmitHandler';

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

export type RecipientFormRef = {
	submit: () => Promise<RecipientFormSubmitPayload>;
};

type RecipientFormProps = {
	defaultValues?: Partial<RecipientFormData>;
	onDirty?(): void;
	onSubmit?(values: RecipientFormSubmitPayload): void;
};

const RecipientForm = forwardRef<RecipientFormRef, RecipientFormProps>((props, ref) => {
	const { defaultValues, onDirty, onSubmit } = props;

	const { t } = useTranslation();
	const getContact = useEndpoint('GET', '/v1/omnichannel/contacts.get');

	const { trigger, control, handleSubmit, formState, clearErrors } = useForm<RecipientFormData>({
		defaultValues,
		mode: 'onChange',
		reValidateMode: 'onChange',
	});

	const { errors, isDirty } = formState;

	const recipientFormId = useId();

	const [contactId, providerId, recipient] = useWatch({
		name: ['contactId', 'providerId', 'recipient'],
		control,
	});

	const {
		data: provider,
		isError: isErrorProvider,
		isFetching: isFetchingProvider,
		refetch: refetchProvider,
	} = useQuery({
		queryKey: ['outbound-message', 'provider', providerId],
		queryFn: () => getProviderMetadataMock(),
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
		contact && trigger(['recipient']);
	}, [contact, trigger]);

	// validate sender field when provider changes
	useEffect(() => {
		provider && trigger(['sender']);
	}, [provider, trigger]);

	useEffect(() => {
		isDirty && onDirty?.();
	}, [isDirty, onDirty]);

	const submit = useEffectEvent(async (values: RecipientFormData) => {
		const { contactId, providerId, sender, recipient } = values;

		if (!contact || !provider) {
			throw Error('error-contact-provider-not-found');
		}

		const payload = { contactId, providerId, provider, contact, sender, recipient };

		onSubmit?.(payload);

		return payload;
	});

	useImperativeHandle(ref, () => ({ submit: createSubmitHandler(submit, handleSubmit) }), [submit, handleSubmit]);

	return (
		<form id={recipientFormId} onSubmit={handleSubmit(submit)}>
			<FieldGroup>
				<Field>
					<FieldLabel required id={`${recipientFormId}-contact`}>
						{t('Contact')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='contactId'
							rules={{
								required: t('Required_field', { field: t('Contact') }),
								validate: () => isErrorContact && t('Error_loading__name__information', { name: t('contact') }),
							}}
							render={({ field }) => (
								<AutoCompleteContact
									aria-labelledby={`${recipientFormId}-contact`}
									aria-describedby={errors.contactId && `${recipientFormId}-contact-error`}
									aria-required={true}
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
					<FieldLabel required htmlFor={`${recipientFormId}-channel`}>
						{t('Channel')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='providerId'
							rules={{
								required: !!contact && t('Required_field', { field: t('Channel') }),
								validate: () => isErrorProvider && t('Error_loading__name__information', { name: t('channel') }),
							}}
							render={({ field }) => (
								<AutoCompleteOutboundProvider
									id={`${recipientFormId}-channel`}
									aria-required={true}
									aria-invalid={!!errors.providerId}
									aria-describedby={`
												${errors.providerId && `${recipientFormId}-channel-error`}
                        ${provider && `${recipientFormId}-channel-hint`}
                      `}
									error={errors.providerId?.message}
									disabled={!contact}
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
					{provider?.lastChat && (
						<FieldHint id={`${recipientFormId}-channel-hint`}>{t('Last_contact__time__', { time: provider.lastChat })}</FieldHint>
					)}
				</Field>
				<Field>
					<FieldLabel required id={`${recipientFormId}-recipient`}>
						{t('To')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='recipient'
							rules={{
								validate: {
									noPhoneNumber: () => {
										return !contactId || !contact || !!contact.phones?.length;
									},
									required: (value) => (!!providerId && !value?.trim() ? t('Required_field', { field: t('To') }) : true),
								},
							}}
							render={({ field }) => (
								<RecipientSelect
									contact={contact}
									type={provider?.providerType || 'phone'}
									aria-labelledby={`${recipientFormId}-recipient`}
									aria-describedby={errors.recipient && `${recipientFormId}-recipient-error`}
									aria-required={true}
									aria-invalid={!!errors.recipient}
									error={errors.recipient && 'error'}
									placeholder={t('Contact_detail')}
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
					<FieldLabel required htmlFor={`${recipientFormId}-sender`}>
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
									aria-labelledby={`${recipientFormId}-sender`}
									aria-describedby={errors.sender && `${recipientFormId}-sender-error`}
									aria-required={true}
									aria-invalid={!!errors.sender}
									error={errors.sender?.message}
									disabled={!recipient}
									placeholder={t('Workspace_detail')}
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
		</form>
	);
});

RecipientForm.displayName = 'RecipientForm';

export default RecipientForm;
