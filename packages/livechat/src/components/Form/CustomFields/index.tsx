import type { Control, FieldErrors, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { RegisterFormValues } from '../../../routes/Register';
import { FormField } from '../FormField';
import { SelectInput } from '../SelectInput';
import { TextInput } from '../TextInput';

export type CustomField = {
	_id: string;
	required?: boolean;
	label?: string;
	type: 'input' | 'select';
	options?: string[];
	defaultValue?: string;
	regexp?: RegExp;
};

type RenderCustomFieldsProps = {
	customFields: CustomField[];
	loading: boolean;
	control: Control<RegisterFormValues>;
	errors: FieldErrors<FieldValues>;
};

export const CustomFields = ({ customFields, loading, control, errors }: RenderCustomFieldsProps) => {
	const { t } = useTranslation();

	const customFieldsList = customFields.map(({ _id, required = false, label, type, options, regexp, defaultValue }) => {
		const rules =
			type === 'select'
				? { required }
				: {
						required,
						...(regexp && {
							pattern: {
								value: regexp,
								message: t('invalid', { field: label }),
							},
						}),
				  };

		return (
			<FormField label={label} required={required} key={_id} error={errors?.[_id]?.message?.toString()}>
				<Controller
					name={_id}
					control={control}
					defaultValue={defaultValue}
					rules={rules}
					render={({ field }) => {
						switch (type) {
							case 'input':
								return <TextInput placeholder={t('insert_your_field_here', { field: label })} disabled={loading} {...field} />;
							case 'select':
								return (
									<SelectInput
										placeholder={t('choose_an_option')}
										options={options?.map((option: string) => ({ value: option, label: option })) ?? []}
										disabled={loading}
										{...field}
									/>
								);
						}
					}}
				/>
			</FormField>
		);
	});
	return <>{customFieldsList}</>;
};
