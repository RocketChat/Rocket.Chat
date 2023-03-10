import { TextInput, Field, Select } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import type { Control, FieldError } from 'react-hook-form';
import { Controller, get } from 'react-hook-form';

import { useAccountsCustomFields } from '../../hooks/useAccountsCustomFields';

const CUSTOM_FIELD_TYPE = {
	select: Select,
	text: TextInput,
} as const;

const CustomFieldsAssembler = ({ formControl }: { formControl: Control }) => {
	const t = useTranslation();
	const parsedCustomFields = useAccountsCustomFields();

	const customFields = parsedCustomFields
		? Object.entries(parsedCustomFields).map(([fieldName, fieldData]) => {
				return { ...fieldData, name: fieldName };
		  })
		: undefined;

	return (
		<>
			{customFields?.map((customField, index) => {
				const getErrorMessage = (error: FieldError) => {
					switch (error?.type) {
						case 'required':
							return t('The_field_is_required', customField.name);
						case 'minLength':
							return t('Min_length_is', customField.minLength);
						case 'maxLength':
							return t('Max_length_is', customField.maxLength);
					}
				};

				return (
					<Controller
						key={index}
						name={customField.name}
						control={formControl}
						defaultValue={customField.defaultValue ?? ''}
						rules={{
							required: customField?.required,
							minLength: customField.type === 'text' ? customField.minLength : undefined,
							maxLength: customField.type === 'text' ? customField.maxLength : undefined,
						}}
						render={({ field, formState: { errors } }) => {
							const Component = CUSTOM_FIELD_TYPE[customField.type] ?? null;
							const error = getErrorMessage(get(errors, customField.name));

							return (
								<Field>
									<Field.Label>
										{t(customField.name as TranslationKey)}
										{customField.required && '*'}
									</Field.Label>
									<Field.Row>
										<Component {...field} options={customField.options} error={error} />
									</Field.Row>
									<Field.Error>{error}</Field.Error>
								</Field>
							);
						}}
					/>
				);
			})}
		</>
	);
};

export default CustomFieldsAssembler;
