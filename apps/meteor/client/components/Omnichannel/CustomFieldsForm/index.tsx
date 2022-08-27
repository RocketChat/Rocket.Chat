import validation from 'ajv/dist/vocabularies/validation';
import React, { ReactElement } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { CustomSelectInput } from './CustomSelectInput';
import { CustomTextInput } from './CustomTextInput';
import { useCustomFields } from './hooks/useCustomFields';

const CustomFieldsForm = (): ReactElement | null => {
	const result = useCustomFields();

	const { register, control } = useFormContext<{ livechatData: Record<string, unknown> }>();

	const { data, isLoading } = result;

	if (!data || isLoading) {
		return null;
	}

	if (result.isError) {
		throw result.error;
	}

	return (
		<>
			{data.customFields.map((customField) => {
				if (customField.scope !== 'room') {
					return null;
				}

				switch (customField.type) {
					case 'input':
						return (
							<CustomTextInput
								key={customField._id}
								data={customField}
								{...register(`livechatData.${customField._id}`, {
									validate: {
										required: (value) => !!value,
										regexp: (value) => !!String(value).match(new RegExp(customField.regexp)),
									},
								})}
							/>
						);
					case 'select':
						return (
							<Controller
								key={customField._id}
								control={control}
								name={`livechatData.${customField._id}`}
								render={({ field }): ReactElement => <CustomSelectInput data={customField} {...field} />}
								rules={{
									validate: {
										required: (value) => !!value,
									},
								}}
							/>
						);
					default:
						return null;
				}
			})}
		</>
	);
};

export default CustomFieldsForm;
