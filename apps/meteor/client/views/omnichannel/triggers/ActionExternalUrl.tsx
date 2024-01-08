import { Button, Field, FieldHint, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import React from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { TriggersPayload } from './EditTrigger';

type ActionExternalUrlType = ComponentProps<typeof Field> & {
	control: Control<TriggersPayload>;
	index: number;
};

export const ActionExternalUrl = ({ control, index, ...props }: ActionExternalUrlType) => {
	const serviceUrlId = useUniqueId();
	const sendTestEndpoint = useEndpoint('POST', '/v1/livechat/triggers/webhook-test');
	const name = `actions.${index}.params.serviceUrl` as const;
	const serviceUrl = useWatch({ control, name });
	const { t } = useTranslation();

	const sendTest = useMutation({
		mutationFn: sendTestEndpoint,
		onSuccess: (data) => {
			console.log(data);
		},
	});

	const onSendTest = () => {
		sendTest.mutate({
			webhookUrl: serviceUrl,
			timeout: 10,
			fallbackMessage: '',
			extraData: [],
		});
	};

	return (
		<Field {...props}>
			<FieldLabel htmlFor={serviceUrlId}>{t('External_service_url')}</FieldLabel>
			<FieldRow>
				<Controller
					name={name}
					control={control}
					render={({ field }) => {
						return <TextInput {...field} />;
					}}
				/>
			</FieldRow>
			<FieldHint>Click on "Send test" before saving the trigger.</FieldHint>
			<Button onClick={onSendTest}>{t('Send_Test')}</Button>
		</Field>
	);
};
