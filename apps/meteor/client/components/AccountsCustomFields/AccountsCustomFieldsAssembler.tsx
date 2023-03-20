import { TextInput, Field, Select } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import type { FieldError } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';

import { useAccountsCustomFields } from '../../hooks/useAccountsCustomFields';

const AccountsCustomFieldsAssembler = () => {
	const t = useTranslation();
	const customFields = useAccountsCustomFields();

	const { register, getFieldState, setValue } = useFormContext();

	return (
		<>
			{customFields?.map((customField, index) => {
				const getErrorMessage = (error: FieldError | undefined) => {
					switch (error?.type) {
						case 'required':
							return t('The_field_is_required', customField.name);
						case 'minLength':
							return t('Min_length_is', customField.minLength);
						case 'maxLength':
							return t('Max_length_is', customField.maxLength);
					}
				};

				const { onChange, ...handlers } = register(customField.name, {
					required: customField.required,
					minLength: customField.minLength,
					maxLength: customField.maxLength,
				});

				const error = getErrorMessage(getFieldState(customField.name).error);
				return (
					<Field key={index}>
						<Field.Label>
							{t.has(customField.name) ? t(customField.name) : customField.name}
							{customField.required && '*'}
						</Field.Label>
						<Field.Row>
							{customField.type === 'select' && (
								/*
									the Select component is a controlled component,
									the onchange handler are not compatible among them,
								 	so we need to setValue on the onChange handler

									Select also doesn't follow the ideal implementation, but is what we have for now
								 */
								<Select
									onChange={(value) => {
										setValue(customField.name, value);
									}}
									{...handlers}
									options={customField.options.map((option) => [option, option, customField.defaultValue === option])}
									error={error}
									value={customField.defaultValue}
								/>
							)}
							{customField.type === 'text' && <TextInput onChange={onChange} {...handlers} error={error} />}
						</Field.Row>
						<Field.Error>{error}</Field.Error>
					</Field>
				);
			})}
		</>
	);
};

export default AccountsCustomFieldsAssembler;
