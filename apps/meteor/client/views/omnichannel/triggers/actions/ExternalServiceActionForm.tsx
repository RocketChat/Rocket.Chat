import { FieldError, Field, FieldHint, FieldLabel, FieldRow, NumberInput, TextAreaInput, FieldGroup } from '@rocket.chat/fuselage';
import { useId, type ComponentProps, type FocusEvent } from 'react';
import type { Control, UseFormTrigger } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import type { TriggersPayload } from '../EditTrigger';
import { useFieldError } from '../hooks';
import { ActionExternalServiceUrl } from './ActionExternalServiceUrl';
import { ActionSender } from './ActionSender';

type SendMessageActionFormType = ComponentProps<typeof Field> & {
	index: number;
	control: Control<TriggersPayload>;
	trigger: UseFormTrigger<TriggersPayload>;
};

export const ExternalServiceActionForm = ({ control, trigger, index, ...props }: SendMessageActionFormType) => {
	const { t } = useTranslation();

	const hasLicense = useHasLicenseModule('livechat-enterprise');

	const timeoutFieldId = useId();
	const timeoutFieldName = `actions.${index}.params.serviceTimeout` as const;
	const fallbackMessageFieldId = useId();
	const fallbackMessageFieldName = `actions.${index}.params.serviceFallbackMessage` as const;

	const [timeoutError, fallbackMessageError] = useFieldError({ control, name: [timeoutFieldName, fallbackMessageFieldName] });

	return (
		<FieldGroup {...props}>
			<ActionSender disabled={!hasLicense} control={control} index={index} />

			<ActionExternalServiceUrl disabled={!hasLicense} control={control} trigger={trigger} index={index} />

			<Field>
				<FieldLabel required htmlFor={timeoutFieldId}>
					{t('Timeout_in_miliseconds')}
				</FieldLabel>
				<FieldRow>
					<Controller
						control={control}
						name={timeoutFieldName}
						defaultValue={10000}
						rules={{
							required: t('Required_field', { field: t('Timeout_in_miliseconds') }),
							min: { value: 0, message: t('Timeout_in_miliseconds_cant_be_negative_number') },
						}}
						render={({ field }) => {
							return (
								<NumberInput
									{...field}
									error={timeoutError?.message}
									aria-invalid={Boolean(timeoutError)}
									aria-describedby={`${timeoutFieldId}-hint`}
									aria-required={true}
									onFocus={(v: FocusEvent<HTMLInputElement>) => v.currentTarget.select()}
									disabled={!hasLicense}
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
								disabled={!hasLicense}
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
