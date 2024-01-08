import type { ILivechatUseExternalServiceAction } from '@rocket.chat/core-typings';
import { FieldError, Field, FieldHint, FieldLabel, FieldRow, NumberInput, TextAreaInput, FieldGroup } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, FocusEvent, FormEvent } from 'react';
import React from 'react';
import type { Control, FieldErrorsImpl } from 'react-hook-form';
import { Controller, useFormState } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ActionExternalUrl } from '../ActionExternalUrl';
import { ActionSender } from '../ActionSender';
import type { TriggersPayload } from '../EditTrigger';

type SendMessageActionFormType = ComponentProps<typeof Field> & {
	index: number;
	control: Control<TriggersPayload>;
};

export const ExternalServiceActionForm = ({ control, index, ...props }: SendMessageActionFormType) => {
	const timeoutFieldId = useUniqueId();
	const serviceFallbackMessageId = useUniqueId();

	const { t } = useTranslation();
	const timeoutName = `actions.${index}.params.serviceTimeout` as const;
	const fallbackMessageName = `actions.${index}.params.serviceFallbackMessage` as const;

	const { errors } = useFormState<TriggersPayload>({ control, name: [timeoutName, fallbackMessageName] });
	const actionErrors = errors?.actions?.[index] as FieldErrorsImpl<Required<ILivechatUseExternalServiceAction>>;
	const { serviceTimeout: timeoutError, serviceFallbackMessage: fallbackMessageError } = actionErrors?.params || {};

	return (
		<FieldGroup {...props}>
			<ActionSender control={control} index={index} />

			<ActionExternalUrl control={control} index={index} />

			<Field>
				<FieldLabel htmlFor={timeoutFieldId}>{t('Timeout_in_miliseconds')}</FieldLabel>
				<FieldRow>
					<Controller
						name={timeoutName}
						control={control}
						rules={{ required: t('The_field_is_required', t('Timeout_in_miliseconds')), min: { value: 0, message: t('Invalid_value') } }}
						render={({ field }) => {
							console.log(field.value);
							return (
								<NumberInput
									{...field}
									value={field.value}
									error={timeoutError?.message}
									aria-invalid={Boolean(timeoutError)}
									aria-describedby={`${timeoutFieldId}-error`}
									aria-required={true}
									onChange={(v: FormEvent<HTMLInputElement>) => field.onChange(Number(v.currentTarget.value || 0))}
									onFocus={(v: FocusEvent<HTMLInputElement>) => v.currentTarget.select()}
								/>
							);
						}}
					/>
				</FieldRow>

				{timeoutError && (
					<FieldError aria-live='assertive' id={`${timeoutFieldId}-error`}>
						{timeoutError.message}
					</FieldError>
				)}

				<FieldHint>{t('Timeout_in_miliseconds_hint')}</FieldHint>
			</Field>

			<Field>
				<FieldLabel htmlFor={serviceFallbackMessageId}>{t('Fallback_message')}</FieldLabel>
				<FieldRow>
					<Controller
						name={fallbackMessageName}
						control={control}
						render={({ field }) => (
							<TextAreaInput
								{...field}
								rows={3}
								placeholder={t('Fallback_message')}
								error={fallbackMessageError?.message}
								aria-invalid={Boolean(fallbackMessageError)}
								aria-describedby={`${serviceFallbackMessageId}-error`}
								aria-required={true}
							/>
						)}
					/>
				</FieldRow>

				{fallbackMessageError && (
					<FieldError aria-live='assertive' id={`${serviceFallbackMessageId}-error`}>
						{fallbackMessageError.message}
					</FieldError>
				)}

				<FieldHint>{t('Service_fallback_message_hint')}</FieldHint>
			</Field>
		</FieldGroup>
	);
};
