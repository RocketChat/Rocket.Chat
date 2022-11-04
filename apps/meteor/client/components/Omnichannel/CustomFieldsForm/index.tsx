import React, { ReactElement, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { dispatchToastMessage } from '../../../lib/toast';
import { CustomSelectInput } from './CustomSelectInput';
import { CustomTextInput } from './CustomTextInput';
import { useCustomFields } from './hooks/useCustomFields';

const FormComponents = {
  input: CustomTextInput,
  select: CustomSelectInput,
}

const CustomFieldsForm = (): ReactElement | null => {
	const { data, isLoading, isError, error } = useCustomFields();

	const { control } = useFormContext<{ livechatData: Record<string, unknown> }>();

	if (!data || isLoading) {
		return null;
	}

	if (isError) {
		dispatchToastMessage({ type: 'error', message: error.message });
		return null;
	}

  const fields = useMemo(() => data.customFields
    .filter(field => field.scope === 'room' && field.type in FormComponents)
    .map(field => ({
      ...field,
      regexp: field.regexp ?? new RegExp(field.regexp),
      Component: FormComponents[field.type]
    })
  ), [data.customFields])

	return (
		<>
			{fields.map(({ Component, ...customField }) => (
        <Controller 
          key={customField._id}
          control={control}
          name={`livechatData.${customField._id}`}
          render={({ field }): ReactElement => <Component data={customField} {...field} />}
          rules={{
            required: customField.required,
            validate: {
              regexp: (value) => !!customField.regexp || !!String(value).match(customField.regexp),
            }
          }}
        />
      ))}
		</>
	);
};

export default CustomFieldsForm;
