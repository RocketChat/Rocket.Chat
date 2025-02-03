import { Field, FieldLabel, FieldRow, FieldError, TextInput, ToggleSwitch } from '@rocket.chat/fuselage';
import { useId } from 'react';
import type { ComponentProps } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AutoCompleteDepartmentMultiple from '../../components/AutoCompleteDepartmentMultiple';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import type { BusinessHoursFormData } from '../../views/omnichannel/businessHours/BusinessHoursForm';

const BusinessHoursMultiple = ({ className }: { className?: ComponentProps<typeof Field>['className'] }) => {
	const { t } = useTranslation();
	const {
		control,
		formState: { errors },
	} = useFormContext<BusinessHoursFormData>();
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	const enabledField = useId();
	const nameField = useId();
	const departmentsField = useId();

	if (!hasLicense) {
		return null;
	}

	return (
		<>
			<Field className={className}>
				<FieldRow>
					<FieldLabel htmlFor={enabledField}>{t('Enabled')}</FieldLabel>
					<Controller
						name='active'
						control={control}
						render={({ field: { value, ...field } }) => <ToggleSwitch id={enabledField} {...field} checked={value} />}
					/>
				</FieldRow>
			</Field>
			<Field className={className}>
				<FieldLabel htmlFor={nameField} required>
					{t('Name')}
				</FieldLabel>
				<FieldRow>
					<Controller
						name='name'
						control={control}
						rules={{ required: t('Required_field', { field: t('Name') }) }}
						render={({ field }) => <TextInput id={nameField} {...field} aria-describedby={`${departmentsField}-error`} />}
					/>
				</FieldRow>
				{errors?.name && (
					<FieldError aria-live='assertive' id={`${departmentsField}-error`}>
						{errors.name.message}
					</FieldError>
				)}
			</Field>
			<Field className={className}>
				<FieldLabel htmlFor={departmentsField}>{t('Departments')}</FieldLabel>
				<FieldRow>
					<Controller
						name='departments'
						control={control}
						render={({ field: { value, onChange, name, onBlur } }) => (
							<AutoCompleteDepartmentMultiple
								id={departmentsField}
								value={value}
								onChange={onChange}
								name={name}
								onBlur={onBlur}
								enabled={true}
							/>
						)}
					/>
				</FieldRow>
			</Field>
		</>
	);
};

export default BusinessHoursMultiple;
