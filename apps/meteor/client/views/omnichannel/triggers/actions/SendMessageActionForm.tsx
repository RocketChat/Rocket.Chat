import { Field, FieldError, FieldLabel, FieldRow, TextAreaInput } from '@rocket.chat/fuselage';
import { useId, type ComponentProps } from 'react';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { TriggersPayload } from '../EditTrigger';
import { useFieldError } from '../hooks';
import { ActionSender } from './ActionSender';

type SendMessageActionFormType = ComponentProps<typeof Field> & {
	index: number;
	control: Control<TriggersPayload>;
};

export const SendMessageActionForm = ({ control, index, ...props }: SendMessageActionFormType) => {
	const { t } = useTranslation();
	const messageFieldId = useId();
	const name = `actions.${index}.params.msg` as const;
	const [messageError] = useFieldError({ control, name });

	return (
		<>
			<ActionSender {...props} control={control} index={index} />

			<Field {...props}>
				<FieldLabel required htmlFor={messageFieldId}>
					{t('Message')}
				</FieldLabel>
				<FieldRow>
					<Controller
						control={control}
						name={name}
						defaultValue=''
						rules={{ required: t('Required_field', { field: t('Message') }) }}
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
