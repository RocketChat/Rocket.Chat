import { TextInput, Field, Select } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import type { Control } from 'react-hook-form';
import { Controller, get } from 'react-hook-form';

import { useAccountsCustomFields } from './useAccountsCustomFields';

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
	// Max_length_is
	// Min_length_is
	return (
		<>
			{customFields?.map((customField, index) => (
				<Controller
					key={index}
					name={customField.name}
					control={formControl}
					defaultValue={customField.defaultValue ?? ''}
					rules={{ required: customField.required && t('The_field_is_required', customField.name) }}
					render={({ field, formState: { errors } }) => {
						const Component = CUSTOM_FIELD_TYPE[customField.type] ?? null;

						console.log(get(errors, customField.name));

						return (
							<Field>
								<Field.Label>
									{t(customField.name as TranslationKey)}
									{customField.required && '*'}
								</Field.Label>
								<Field.Row>
									<Component {...field} options={customField.options} error={get(errors, customField.name)} />
								</Field.Row>
								<Field.Error>{get(errors, customField.name)?.message}</Field.Error>
							</Field>
						);
					}}
				/>
			))}
		</>
	);
};

export default CustomFieldsAssembler;
