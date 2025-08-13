import type { IOutboundProviderMetadata, Serialized, ILivechatContact } from '@rocket.chat/core-typings';
import {
	Box,
	Button,
	Field,
	FieldError,
	FieldGroup,
	FieldHint,
	FieldLabel,
	FieldRow,
	Option,
	OptionDescription,
} from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useId, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { useTimeFromNow } from '../../../../../../hooks/useTimeFromNow';
import { formatPhoneNumber } from '../../../../../../lib/formatPhoneNumber';
import { omnichannelQueryKeys } from '../../../../../../lib/queryKeys';
import AutoCompleteContact from '../../../../../AutoCompleteContact';
import { findLastChatFromChannel } from '../../../utils/findLastChatFromChannel';
import AutoCompleteOutboundProvider from '../../AutoCompleteOutboundProvider';
import RecipientSelect from '../../RecipientSelect';
import SenderSelect from '../../SenderSelect';
import RetryButton from '../components/RetryButton';
import { useFormKeyboardSubmit } from '../hooks/useFormKeyboardSubmit';
import { cxp } from '../utils/cx';
import { ContactNotFoundError, ProviderNotFoundError } from '../utils/errors';

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
	const dispatchToastMessage = useToastBarDispatch();

	const { trigger, control, handleSubmit, formState, clearErrors, setValue } = useForm<RecipientFormData>({
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
		data: contact,
		isError: isErrorContact,
		isSuccess: isSuccessContact,
		isFetching: isFetchingContact,
		refetch: refetchContact,
	} = useQuery({
		queryKey: omnichannelQueryKeys.contact(contactId),
		queryFn: () => getContact({ contactId }),
		staleTime: 5 * 60 * 1000,
		select: (data) => data?.contact || undefined,
		enabled: !!contactId,
	});

	const {
		data: provider,
		isError: isErrorProvider,
		isSuccess: isSuccessProvider,
		isFetching: isFetchingProvider,
		refetch: refetchProvider,
	} = useQuery({
		queryKey: omnichannelQueryKeys.outboundProviderMetadata(providerId),
		queryFn: () => getProvider(),
		select: (data) => data?.metadata,
		staleTime: 5 * 60 * 1000,
		enabled: !!providerId,
	});

	const providerLastChat = useMemo(() => {
		return findLastChatFromChannel(contact?.channels, providerId);
	}, [contact?.channels, providerId]);

	const hasRecipientOptions = !!contact && !!contact.phones?.length;
	const hasProviderOptions = !!provider && !!Object.keys(provider.templates).length;
	const isContactNotFound = isSuccessContact && !contact;
	const isProviderNotFound = isSuccessProvider && !provider;

	const validateContactField = useEffectEvent((shouldValidate = false) => {
		trigger('contactId');
		setValue('recipient', '', { shouldValidate });
	});

	const validateProviderField = useEffectEvent((shouldValidate = false) => {
		trigger('providerId');
		setValue('sender', '', { shouldValidate });
	});

	useEffect(() => {
		if (isSuccessContact && !hasRecipientOptions) {
			trigger('recipient');
		}

		return () => clearErrors('recipient');
	}, [clearErrors, trigger, hasRecipientOptions, isSuccessContact]);

	useEffect(() => {
		if (isSuccessProvider && !hasProviderOptions) {
			trigger('sender');
		}

		return () => clearErrors('sender');
	}, [clearErrors, trigger, hasProviderOptions, isSuccessProvider]);

	useEffect(() => {
		isErrorContact && validateContactField();
		return () => clearErrors('contactId');
	}, [clearErrors, isErrorContact, validateContactField]);

	useEffect(() => {
		isErrorProvider && validateProviderField();
		return () => clearErrors('providerId');
	}, [clearErrors, isErrorProvider, validateProviderField]);

	useEffect(() => {
		isDirty && onDirty && onDirty();
	}, [isDirty, onDirty]);

	const submit = useEffectEvent(async (values: RecipientFormData) => {
		try {
			// Wait if contact or provider is still being fetched in background
			const [updatedContact, updatedProvider] = await Promise.all([
				isFetchingContact ? refetchContact().then((r) => r.data) : Promise.resolve(contact),
				isFetchingProvider ? refetchProvider().then((r) => r.data) : Promise.resolve(provider),
			]);

			if (!updatedContact) {
				throw new ContactNotFoundError();
			}

			if (!updatedProvider) {
				throw new ProviderNotFoundError();
			}

			onSubmit({ ...values, provider: updatedProvider, contact: updatedContact });
		} catch (error) {
			if (error instanceof ContactNotFoundError) {
				validateContactField(true);
				return;
			}

			if (error instanceof ProviderNotFoundError) {
				validateProviderField(true);
				return;
			}

			dispatchToastMessage({ type: 'error', message: t('Something_went_wrong') });
		}
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
								validate: {
									fetchError: () =>
										isErrorContact || isContactNotFound ? t('Error_loading__name__information', { name: t('contact') }) : true,
									required: (value) => (!value ? t('Required_field', { field: t('Contact') }) : true),
								},
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
									renderItem={({ label, ...props }, { phones }) => (
										<Option {...props} label={label} avatar={<UserAvatar title={label} username={label} size='x20' />}>
											{phones?.length ? (
												<OptionDescription>{`(${phones.map((p) => formatPhoneNumber(p.phoneNumber)).join(', ')})`}</OptionDescription>
											) : null}
										</Option>
									)}
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
								validate: {
									fetchError: () =>
										isErrorProvider || isProviderNotFound ? t('Error_loading__name__information', { name: t('channel') }) : true,
									required: (value) => (!value ? t('Required_field', { field: t('Channel') }) : true),
								},
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
									noPhoneNumber: () => hasRecipientOptions,
									required: (value) => (!value ? t('Required_field', { field: t('To') }) : true),
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
									disabled={!providerId || !contact || isFetchingContact}
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
									noPhoneNumber: () => hasProviderOptions || t('No_phone_number_available_for_selected_channel'),
									required: (value) => (!value ? t('Required_field', { field: t('From') }) : true),
								},
							}}
							render={({ field }) => (
								<SenderSelect
									provider={provider}
									aria-busy={isFetchingProvider}
									aria-labelledby={`${recipientFormId}-sender`}
									aria-describedby={errors.sender && `${recipientFormId}-sender-error`}
									aria-invalid={!!errors.sender}
									error={errors.sender?.message}
									disabled={!recipient || !provider || isFetchingProvider}
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
