import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldHint, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { useMemo } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';

import { useHasLicenseModule } from '../../../../../ee/client/hooks/useHasLicenseModule';
import { type TriggersPayload } from '../EditTrigger';
import { useActionForm } from '../hooks/useActionForm';

type SendMessageFormType = ComponentProps<typeof Field> & {
	control: Control<TriggersPayload>;
	index: number;
};

const ACTION_HINTS: Record<string, TranslationKey> = {
	'use-external-service': 'External_service_action_hint',
} as const;

export const ActionForm = ({ control, index, ...props }: SendMessageFormType) => {
	const t = useTranslation();

	const actionFieldId = useUniqueId();
	const actionFieldName = `actions.${index}.name` as const;
	const actionFieldValue = useWatch({ control, name: actionFieldName });

	const hasLicense = useHasLicenseModule('livechat-enterprise');

	const actionOptions: SelectOption[] = useMemo(
		() => [
			['send-message', t('Send_a_message')],
			hasLicense ? ['use-external-service', t('Send_a_message_external_service')] : ['', t('Send_a_message_external_service_premium')],
		],
		[hasLicense, t],
	);

	const ActionFormParams = useActionForm(actionFieldValue);
	const actionHint = useMemo(() => ACTION_HINTS[actionFieldValue] || '', [actionFieldValue]);

	return (
		<FieldGroup {...props}>
			<Field>
				<FieldLabel htmlFor={actionFieldId}>{t('Action')}</FieldLabel>
				<FieldRow>
					<Controller
						name={actionFieldName}
						control={control}
						render={({ field }) => {
							return <Select {...field} id={actionFieldId} options={actionOptions} placeholder={t('Select_an_option')} />;
						}}
					/>
				</FieldRow>
				{actionHint && <FieldHint>{t(actionHint)}</FieldHint>}
			</Field>

			<ActionFormParams control={control} index={index} />
		</FieldGroup>
	);
};
