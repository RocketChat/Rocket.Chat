import React, { ReactElement } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { CustomSelectInput } from './CustomSelectInput';
import { CustomTextInput } from './CustomTextInput';
import { useCustomFields } from './hooks/useCustomFields';

const CustomFieldsForm = (): ReactElement | null => {
	const { data, isLoading, isError, error } = useCustomFields();

	const { register, control } = useFormContext<{ livechatData: Record<string, unknown> }>();

	if (!data || isLoading) {
		return null;
	}

	if (isError) {
		throw error;
	}

	return (
		<>
			{data.customFields
				.filter(
					(customField) =>
						// TODO: REMOVE FILTER ONCE THE ENDPOINT SUPPORTS A SCOPE PARAMETER
						customField.scope === 'room',
				)
				.map((customField) => {
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
