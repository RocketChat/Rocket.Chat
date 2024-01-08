import type { ILivechatSendMessageAction } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldLabel, FieldRow, TextAreaInput } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import React from 'react';
import type { Control, FieldErrorsImpl } from 'react-hook-form';
import { Controller, useFormState } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ActionSender } from '../ActionSender';
import type { TriggersPayload } from '../EditTrigger';

type SendMessageActionFormType = ComponentProps<typeof Field> & {
	index: number;
	control: Control<TriggersPayload>;
};

export const SendMessageActionForm = ({ control, index, ...props }: SendMessageActionFormType) => {
	const { t } = useTranslation();
	const messageFieldId = useUniqueId();
	const name = `actions.${index}.params.msg` as const;
	const { errors } = useFormState<TriggersPayload>({ control, name });
	const actionErrors = errors?.actions?.[index] as FieldErrorsImpl<Required<ILivechatSendMessageAction>>;
	const messageError = actionErrors?.params?.msg;

	return (
		<>
			<ActionSender {...props} control={control} index={index} />

			<Field {...props}>
				<FieldLabel htmlFor={messageFieldId}>{t('Message')}</FieldLabel>
				<FieldRow>
					<Controller
						name={name}
						control={control}
						rules={{ required: t('The_field_is_required', t('Message')) }}
						render={({ field }) => (
							<TextAreaInput
								error={messageError?.message}
								aria-invalid={Boolean(messageError)}
								aria-describedby={`${messageFieldId}-error`}
								aria-required={true}
								{...field}
								rows={3}
								placeholder={`${t('Message')}*`}
							/>
						)}
					/>
				</FieldRow>

				{messageError && (
					<FieldError aria-live='assertive' id={`${messageFieldId}-error`}>
						{messageError.message}
					</FieldError>
				)}
			</Field>
		</>
	);
};
