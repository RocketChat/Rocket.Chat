import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { TemplateParameter, TemplateParameterMetadata } from '../../../../../types/template';
import TemplatePlaceholderInput from '../../../../TemplatePlaceholderSelector';
import type { MessageFormData } from '../MessageForm';

type TemplatePlaceholderFieldProps = ComponentProps<typeof Field> & {
	control: Control<MessageFormData>;
	metadata: TemplateParameterMetadata;
	contact?: Omit<Serialized<ILivechatContact>, 'contactManager'>;
};

const TemplatePlaceholderField = ({ control, metadata, contact, ...props }: TemplatePlaceholderFieldProps) => {
	const { t } = useTranslation();

	const { id, type, name, placeholder, format, componentType, index } = metadata;
	const fieldLabel = `${t(name)} ${placeholder}`;

	const {
		field,
		fieldState: { error },
	} = useController({
		control,
		name: `templateParameters.${componentType}.${index}` as const,
		defaultValue: { type, value: '', format } as TemplateParameter,
		rules: { validate: (param) => (!param?.value?.trim() ? t('Required_field', { field: fieldLabel }) : true) },
		shouldUnregister: true,
	});

	return (
		<Field key={id} {...props}>
			<FieldLabel required htmlFor={id}>
				{fieldLabel}
			</FieldLabel>
			<FieldRow>
				<TemplatePlaceholderInput
					id={id}
					type={type}
					name={field.name}
					contact={contact}
					aria-describedby={error ? `${id}-error` : undefined}
					value={field.value?.value ?? ''}
					error={error?.message}
					onChange={(value) => field.onChange({ type, value, format })}
				/>
			</FieldRow>
			{error ? (
				<FieldError aria-live='assertive' id={`${id}-error`}>
					{error.message}
				</FieldError>
			) : null}
		</Field>
	);
};

export default TemplatePlaceholderField;
