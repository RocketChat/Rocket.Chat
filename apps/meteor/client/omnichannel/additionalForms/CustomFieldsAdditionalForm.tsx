import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, FieldError, FieldHint, ToggleSwitch, TextInput, Select } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useId, useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import type { EditCustomFieldsFormData } from '../../views/omnichannel/customFields/EditCustomFields';

const checkIsOptionsValid = (value: string) => {
	if (!value || value.trim() === '') {
		return false;
	}

	return value.split(',').every((v) => /^[a-zA-Z0-9-_ ]+$/.test(v));
};

const CustomFieldsAdditionalForm = ({ className }: { className?: ComponentProps<typeof Field>['className'] }) => {
	const { t } = useTranslation();
	const {
		control,
		watch,
		formState: { errors },
	} = useFormContext<EditCustomFieldsFormData>();
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	const { visibility, type } = watch();

	const typeOptions: SelectOption[] = useMemo(
		() => [
			['input', t('Input')],
			['select', t('Select')],
		],
		[t],
	);

	const requiredField = useId();
	const typeField = useId();
	const defaultValueField = useId();
	const optionsField = useId();
	const publicField = useId();

	if (!hasLicense) {
		return null;
	}

	return (
		<>
			<Field className={className}>
				<FieldRow>
					<FieldLabel htmlFor={requiredField}>{t('Required')}</FieldLabel>
					<Controller
						name='required'
						control={control}
						render={({ field: { value, ...field } }) => <ToggleSwitch id={requiredField} {...field} checked={value} />}
					/>
				</FieldRow>
			</Field>
			<Field className={className}>
				<FieldLabel htmlFor={typeField}>{t('Type')}</FieldLabel>
				<FieldRow>
					<Controller name='type' control={control} render={({ field }) => <Select id={typeField} options={typeOptions} {...field} />} />
				</FieldRow>
			</Field>
			<Field className={className}>
				<FieldLabel htmlFor={defaultValueField}>{t('Default_value')}</FieldLabel>
				<FieldRow>
					<Controller name='defaultValue' control={control} render={({ field }) => <TextInput id={defaultValueField} {...field} />} />
				</FieldRow>
			</Field>
			<Field className={className}>
				<FieldLabel htmlFor={optionsField}>{t('Options')}</FieldLabel>
				<FieldRow>
					<Controller
						name='options'
						control={control}
						rules={{
							validate: (optionsValue) => (type === 'select' && !checkIsOptionsValid(optionsValue) ? t('error-invalid-value') : undefined),
						}}
						render={({ field }) => (
							<TextInput
								id={optionsField}
								{...field}
								disabled={type === 'input'}
								aria-invalid={Boolean(errors?.options)}
								aria-describedby={`${optionsField}-hint ${optionsField}-error`}
							/>
						)}
					/>
				</FieldRow>
				<FieldHint id={`${optionsField}-hint`}>{t('Livechat_custom_fields_options_placeholder')}</FieldHint>
				{errors.options && (
					<FieldError aria-live='assertive' id={`${optionsField}-error`}>
						{errors.options.message}
					</FieldError>
				)}
			</Field>
			<Field className={className}>
				<FieldRow>
					<FieldLabel htmlFor={publicField}>{t('Public')}</FieldLabel>
					<Controller
						name='public'
						control={control}
						render={({ field: { value, ...field } }) => (
							<ToggleSwitch id={publicField} {...field} disabled={!visibility} checked={value} aria-describedby={`${publicField}-hint`} />
						)}
					/>
				</FieldRow>
				<FieldHint id={`${publicField}-hint`}>{t('Livechat_custom_fields_public_description')}</FieldHint>
			</Field>
		</>
	);
};

export default CustomFieldsAdditionalForm;
