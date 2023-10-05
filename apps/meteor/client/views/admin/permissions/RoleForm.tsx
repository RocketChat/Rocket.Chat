import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Field, FieldLabel, FieldRow, FieldError, FieldHint, TextInput, Select, ToggleSwitch } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

type RoleFormProps = {
	className?: string;
	editing?: boolean;
	isProtected?: boolean;
	isDisabled?: boolean;
};

const RoleForm = ({ className, editing = false, isProtected = false, isDisabled = false }: RoleFormProps): ReactElement => {
	const t = useTranslation();
	const {
		register,
		control,
		formState: { errors },
	} = useFormContext();

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
					<TextInput disabled={editing || isDisabled} placeholder={t('Role')} {...register('name', { required: true })} />
				</FieldRow>
				{errors?.name && <FieldError>{t('error-the-field-is-required', { field: t('Role') })}</FieldError>}
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
						render={({ field }): ReactElement => (
							<Select {...field} options={options} disabled={isProtected || isDisabled} placeholder={t('Scope')} />
						)}
					/>
				</FieldRow>
			</Field>
			<Field className={className}>
				<Box display='flex' flexDirection='row'>
					<FieldLabel>{t('Users must use Two Factor Authentication')}</FieldLabel>
					<FieldRow>
						<Controller
							name='mandatory2fa'
							control={control}
							render={({ field }): ReactElement => <ToggleSwitch {...field} checked={field.value} disabled={isDisabled} />}
						/>
					</FieldRow>
				</Box>
			</Field>
		</>
	);
};

export default RoleForm;
