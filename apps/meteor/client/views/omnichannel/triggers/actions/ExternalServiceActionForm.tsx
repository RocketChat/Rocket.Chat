import { FieldError, Field, FieldHint, FieldLabel, FieldRow, NumberInput, TextAreaInput, FieldGroup } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, FocusEvent, FormEvent } from 'react';
import React from 'react';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ActionExternalUrl } from '../ActionExternalUrl';
import { ActionSender } from '../ActionSender';
import type { TriggersPayload } from '../EditTrigger';
import { useFieldError } from '../hooks/useFieldError';

type SendMessageActionFormType = ComponentProps<typeof Field> & {
	index: number;
	control: Control<TriggersPayload>;
};

export const ExternalServiceActionForm = ({ control, index, ...props }: SendMessageActionFormType) => {
	const { t } = useTranslation();

	const timeoutFieldId = useUniqueId();
	const timeoutFieldName = `actions.${index}.params.serviceTimeout` as const;
	const fallbackMessageFieldId = useUniqueId();
	const fallbackMessageFieldName = `actions.${index}.params.serviceFallbackMessage` as const;

	const [timeoutError, fallbackMessageError] = useFieldError({ control, name: [timeoutFieldName, fallbackMessageFieldName] });

	return (
		<FieldGroup {...props}>
			<ActionSender control={control} index={index} />

			<ActionExternalUrl control={control} index={index} />

			<Field>
				<FieldLabel htmlFor={timeoutFieldId}>{t('Timeout_in_miliseconds')}*</FieldLabel>
				<FieldRow>
					<Controller
						control={control}
						name={timeoutFieldName}
						defaultValue={10000}
						rules={{ required: t('The_field_is_required', t('Timeout_in_miliseconds')), min: { value: 0, message: t('Invalid_value') } }}
						render={({ field }) => {
							return (
								<NumberInput
									{...field}
									error={timeoutError?.message}
									aria-invalid={Boolean(timeoutError)}
									aria-describedby={`${timeoutFieldId}-hint`}
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

				<FieldHint id={`${timeoutFieldId}-hint`}>{t('Timeout_in_miliseconds_hint')}</FieldHint>
			</Field>

			<Field>
				<FieldLabel htmlFor={fallbackMessageFieldId}>{t('Fallback_message')}</FieldLabel>
				<FieldRow>
					<Controller
						control={control}
						name={fallbackMessageFieldName}
						defaultValue=''
						render={({ field }) => (
							<TextAreaInput
								{...field}
								id={fallbackMessageFieldId}
								rows={3}
								placeholder={t('Fallback_message')}
								error={fallbackMessageError?.message}
								aria-invalid={Boolean(fallbackMessageError)}
								aria-describedby={`${fallbackMessageFieldId}-hint`}
								aria-required={true}
							/>
						)}
					/>
				</FieldRow>

				{fallbackMessageError && (
					<FieldError aria-live='assertive' id={`${fallbackMessageFieldId}-error`}>
						{fallbackMessageError.message}
					</FieldError>
				)}

				<FieldHint id={`${fallbackMessageFieldId}-hint`}>{t('Service_fallback_message_hint')}</FieldHint>
			</Field>
		</FieldGroup>
	);
};
