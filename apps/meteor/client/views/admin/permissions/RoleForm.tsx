import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, FieldLabel, FieldRow, FieldError, FieldHint, TextInput, Select, ToggleSwitch } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { EditRolePageFormData } from './EditRolePage';

type RoleFormProps = {
	className?: string;
	editing?: boolean;
	isProtected?: boolean;
	isDisabled?: boolean;
};

const RoleForm = ({ className, editing = false, isProtected = false, isDisabled = false }: RoleFormProps) => {
	const { t } = useTranslation();
	const {
		register,
		control,
		formState: { errors },
	} = useFormContext<EditRolePageFormData>();

	const options: SelectOption[] = useMemo(
		() => [
			['Users', t('Global')],
			['Subscriptions', t('Rooms')],
		],
		[t],
	);

	return (
		<>
			<Field className={className}>
				<FieldLabel>{t('Role')}</FieldLabel>
				<FieldRow>
					<TextInput
						disabled={editing || isDisabled}
						placeholder={t('Role')}
						{...register('name', { required: t('Required_field', { field: t('Role') }) })}
					/>
				</FieldRow>
				{errors?.name && <FieldError>{errors.name.message}</FieldError>}
			</Field>
			<Field className={className}>
				<FieldLabel>{t('Description')}</FieldLabel>
				<FieldRow>
					<TextInput placeholder={t('Description')} disabled={isDisabled} {...register('description')} />
				</FieldRow>
				<FieldHint>Leave the description field blank if you dont want to show the role</FieldHint>
			</Field>
			<Field className={className}>
				<FieldLabel>{t('Scope')}</FieldLabel>
				<FieldRow>
					<Controller
						name='scope'
						control={control}
						render={({ field }) => <Select {...field} options={options} disabled={isProtected || isDisabled} placeholder={t('Scope')} />}
					/>
				</FieldRow>
			</Field>
			<Field className={className}>
				<FieldRow>
					<FieldLabel>{t('Users must use Two Factor Authentication')}</FieldLabel>
					<Controller
						name='mandatory2fa'
						control={control}
						render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} disabled={isDisabled} />}
					/>
				</FieldRow>
			</Field>
		</>
	);
};

export default RoleForm;
