import type { ILivechatTriggerAction } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldHint, FieldLabel, FieldRow, Select } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { useMemo } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { getDefaultAction, type TriggersPayload } from './EditTrigger';
import { useActionForm } from './hooks/useActionForm';

type SendMessageFormType = ComponentProps<typeof Field> & {
	control: Control<TriggersPayload>;
	index: number;
};

const ACTION_HINTS: Record<string, TranslationKey> = {
	'use-external-service': 'External_service_action_hint',
} as const;

export const ActionForm = ({ index, ...props }: SendMessageFormType) => {
	const { control, setValue } = useFormContext<TriggersPayload>();
	const { t } = useTranslation();
	const actionFieldId = useUniqueId();
	// const name = `actions.${index}.name` as const;
	const action = useWatch({ control, name: `actions.${index}` });
	const { name, params } = action || {};
	const actionOptions: SelectOption[] = useMemo(
		() => [
			['send-message', t('Send_a_message')],
			['use-external-service', t('Send_a_message_using_external_service')],
		],
		[t],
	);

	const ActionFormParams = useActionForm(name);
	const actionHint = useMemo(() => ACTION_HINTS[name] || '', [name]);

	return (
		<FieldGroup {...props}>
			<Field>
				<FieldLabel htmlFor={actionFieldId}>{t('Action')}</FieldLabel>
				<FieldRow>
					<Controller
						name={`actions.${index}.name`}
						control={control}
						render={({ field }) => (
							<Select
								{...field}
								id={actionFieldId}
								options={actionOptions}
								placeholder={t('Select_an_option')}
								onChange={(v) => {
									const newAction = { name: v, params } as ILivechatTriggerAction;
									setValue(`actions.${index}`, getDefaultAction(newAction));
								}}
							/>
						)}
					/>
				</FieldRow>
				{actionHint && <FieldHint>{t(actionHint)}</FieldHint>}
			</Field>

			<ActionFormParams control={control} index={index} />
		</FieldGroup>
	);
};
