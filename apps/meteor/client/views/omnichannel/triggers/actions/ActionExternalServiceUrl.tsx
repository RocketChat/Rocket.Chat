import { Box, Button, Field, FieldError, FieldHint, FieldLabel, FieldRow, Icon, TextInput } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import { useId, useState } from 'react';
import type { Control, UseFormTrigger } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { TriggersPayload } from '../EditTrigger';
import { useFieldError } from '../hooks';

type ActionExternaServicelUrlType = ComponentProps<typeof Field> & {
	index: number;
	control: Control<TriggersPayload>;
	trigger: UseFormTrigger<TriggersPayload>;
	disabled?: boolean;
};

export const ActionExternalServiceUrl = ({ control, trigger, index, disabled, ...props }: ActionExternaServicelUrlType) => {
	const { t } = useTranslation();

	const serviceUrlFieldId = useId();
	const serviceUrlFieldName = `actions.${index}.params.serviceUrl` as const;
	const serviceTimeoutFieldName = `actions.${index}.params.serviceTimeout` as const;

	const serviceTimeoutValue = useWatch({ control, name: serviceTimeoutFieldName });
	const [serviceUrlError] = useFieldError({ control, name: serviceUrlFieldName });
	const [isSuccessMessageVisible, setSuccessMessageVisible] = useSafely(useState(false));
	const webhookTestEndpoint = useEndpoint('POST', '/v1/livechat/triggers/external-service/test');

	const showSuccessMesssage = () => {
		setSuccessMessageVisible(true);
		setTimeout(() => setSuccessMessageVisible(false), 3000);
	};

	const webhookTest = useMutation({
		mutationFn: webhookTestEndpoint,
		onSuccess: showSuccessMesssage,
	});

	const testExternalService = async (serviceUrl: string) => {
		if (!serviceUrl) {
			return true;
		}

		try {
			await webhookTest.mutateAsync({
				webhookUrl: serviceUrl,
				timeout: serviceTimeoutValue || 10000,
				fallbackMessage: '',
				extraData: [],
			});
			return true;
		} catch (e) {
			return t((e as { error: TranslationKey }).error);
		}
	};

	return (
		<Field {...props}>
			<FieldLabel required htmlFor={serviceUrlFieldId}>
				{t('External_service_url')}
			</FieldLabel>
			<FieldRow>
				<Controller
					name={serviceUrlFieldName}
					control={control}
					defaultValue=''
					rules={{
						required: t('Required_field', { field: t('External_service_url') }),
						validate: testExternalService,
						deps: serviceTimeoutFieldName,
					}}
					render={({ field }) => {
						return <TextInput {...field} disabled={webhookTest.isPending || disabled} error={serviceUrlError?.message} />;
					}}
				/>
			</FieldRow>

			{serviceUrlError && <FieldError>{serviceUrlError.message}</FieldError>}

			<FieldHint>{t('External_service_test_hint')}</FieldHint>

			<Button loading={webhookTest.isPending} disabled={disabled || isSuccessMessageVisible} onClick={() => trigger(serviceUrlFieldName)}>
				{isSuccessMessageVisible ? (
					<Box is='span' color='status-font-on-success'>
						<Icon name='success-circle' size='x20' verticalAlign='middle' /> {t('Success')}!
					</Box>
				) : (
					t('Send_Test')
				)}
			</Button>
		</Field>
	);
};
