import { Field, FieldGroup, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useId, useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AutoCompleteContact from '../../../../../AutoCompleteContact';
import { StepsWizardContent } from '../../../../../StepsWizard';
import { getProviderMetadataMock } from '../../../mocks';
import AutoCompleteOutboundProvider from '../../AutoCompleteOutboundProvider';
import AutoCompleteRecipient from '../../AutoCompleteRecipient';
import type { OutboundMessageFormData } from '../OutboundMessageWizard';

const RecipientStep = () => {
	const { t } = useTranslation();

	const recipientId = useId();

	const handleRecipientStepValidation = useCallback(async () => {
		return true;
	}, []);

	const { setValue, handleSubmit, resetField } = useFormContext<OutboundMessageFormData>();

	const [contact, providerId] = useWatch({ name: ['contact', 'providerId'] });

	const onSubmit = () => {
		console.log('submited recipient');
	};

	const { data: provider, isSuccess } = useQuery({
		queryKey: ['/v1/omnichannel/outbound/providers/:id/metadata', providerId],
		queryFn: () => getProviderMetadataMock(),
		enabled: !!providerId,
	});

	useEffect(() => {
		if (isSuccess) {
			setValue('provider', provider);
		}

		return () => resetField('provider');
	}, [provider, isSuccess, setValue, resetField]);

	const options = useMemo<[string, string][]>(() => {
		if (!provider) {
			return [];
		}

		return Object.keys(provider.templates).map((phone) => [phone, phone]);
	}, [provider]);

	return (
		<StepsWizardContent title='Recipient' validate={handleRecipientStepValidation}>
			<form id={recipientId} onSubmit={handleSubmit(onSubmit)}>
				<FieldGroup>
					<Field>
						<FieldLabel required id={`${recipientId}-contact`}>
							{t('Contact')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='contact'
								render={({ field }) => (
									<AutoCompleteContact aria-labelledby={`${recipientId}-contact`} value={field.value} onChange={field.onChange} />
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel required htmlFor={`${recipientId}-channel`}>
							{t('Channel')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='providerId'
								render={({ field }) => (
									<AutoCompleteOutboundProvider
										id={`${recipientId}-channel`}
										disabled={!contact}
										value={field.value}
										onChange={field.onChange}
									/>
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel required id={`${recipientId}-to`}>
							{t('To')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='to'
								render={({ field }) => (
									<AutoCompleteRecipient
										contact={contact}
										recipientType='phone'
										aria-labelledby={`${recipientId}-to`}
										value={field.value}
										disabled={!providerId}
										onChange={field.onChange}
									/>
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel required htmlFor={`${recipientId}-from`}>
							{t('From')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='sender'
								render={({ field }) => (
									<Select
										aria-labelledby={`${recipientId}-from`}
										disabled={!providerId}
										value={field.value}
										options={options}
										onChange={field.onChange}
									/>
								)}
							/>
						</FieldRow>
					</Field>
				</FieldGroup>
			</form>
		</StepsWizardContent>
	);
};

export default RecipientStep;
