import { Field, Select } from '@rocket.chat/fuselage';
import type { OmnichannelCustomFieldEndpointPayload } from '@rocket.chat/rest-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { forwardRef, ReactElement, useMemo } from 'react';
import { UseControllerReturn, useFormContext } from 'react-hook-form';

export const CustomSelectInput = forwardRef<
	HTMLInputElement,
	UseControllerReturn['field'] & {
		data: OmnichannelCustomFieldEndpointPayload;
	}
>(function CustomSelectInput({ data, name, value, onChange }, ref): ReactElement {
	const t = useTranslation();
	const {
		formState: { errors },
	} = useFormContext();

	const mappedOptions = useMemo(() => data.options.split(';').map<[string, string]>((value) => [value, value]), [data.options]);

	const errorMessage = useMemo(() => {
		if (errors?.livechatData && errors?.livechatData[data._id]?.type === 'required') {
			return t('The_field_is_required', data.label);
		}
	}, [data._id, data.label, errors?.livechatData, t]);

	return (
		<Field>
			<Field.Label>
				{data.label}
				{data.required && '*'}
			</Field.Label>
			<Field.Row>
				<Select
					name={name}
					value={value}
					onChange={onChange}
					required={data.required}
					error={errorMessage}
					flexGrow={1}
					options={mappedOptions}
					visibility={data.visibility}
					ref={ref}
				/>
			</Field.Row>
			<Field.Error>{errorMessage}</Field.Error>
		</Field>
	);
});
