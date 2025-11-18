import type { IOutboundProviderMetadata, Serialized, ILivechatContact } from '@rocket.chat/core-typings';
import { Box, Button, FieldGroup, Scrollable } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useId, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import ChannelField from './components/ChannelField';
import ContactField from './components/ContactField';
import RecipientField from './components/RecipientField';
import SenderField from './components/SenderField';
import { omnichannelQueryKeys } from '../../../../../../../../lib/queryKeys';
import Form from '../../components/OutboundMessageForm';
import { ContactNotFoundError, ProviderNotFoundError } from '../../utils/errors';

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

	const { isDirty, isSubmitting } = formState;

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
		queryFn: async () => {
			const data = await getContact({ contactId });

			// TODO: Can be safely removed once unknown contacts handling is added to the endpoint
			if (data?.contact && data.contact.unknown) {
				throw new ContactNotFoundError();
			}

			return data;
		},
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

	return (
		<Form id={recipientFormId} onSubmit={handleSubmit(submit)} noValidate>
			<Scrollable vertical>
				<FieldGroup justifyContent='start' pi={2}>
					<ContactField
						control={control}
						isError={isErrorContact || isContactNotFound}
						isFetching={isFetchingContact}
						onRetry={refetchContact}
					/>

					<ChannelField
						control={control}
						contact={contact}
						disabled={!contactId}
						isFetching={isFetchingProvider}
						isError={isErrorProvider || isProviderNotFound}
						onRetry={refetchProvider}
					/>

					<RecipientField
						control={control}
						contact={contact}
						type={provider?.providerType || 'phone'}
						disabled={!providerId || !contact}
						isLoading={isFetchingContact}
					/>

					<SenderField control={control} provider={provider} disabled={!recipient || !provider} isLoading={isFetchingProvider} />
				</FieldGroup>
			</Scrollable>

			{customActions ?? (
				<Box mbs={24} display='flex' justifyContent='end' flexGrow={0} flexShrink={0}>
					<Button type='submit' primary loading={isSubmitting}>
						{t('Submit')}
					</Button>
				</Box>
			)}
		</Form>
	);
};

export default RecipientForm;
