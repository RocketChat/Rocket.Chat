import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Field, TextInput, Select, ToggleSwitch } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

type RoleFormProps = {
	className?: string;
	editing?: boolean;
	isProtected?: boolean;
};

const RoleForm = ({ className, editing = false, isProtected = false }: RoleFormProps): ReactElement => {
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
				<Field.Label>{t('Role')}</Field.Label>
				<Field.Row>
					<TextInput disabled={editing} placeholder={t('Role')} {...register('name', { required: true })} />
				</Field.Row>
				{errors?.name && <Field.Error>{t('error-the-field-is-required', { field: t('Role') })}</Field.Error>}
			</Field>
			<Field className={className}>
				<Field.Label>{t('Description')}</Field.Label>
				<Field.Row>
					<TextInput placeholder={t('Description')} {...register('description')} />
				</Field.Row>
				<Field.Hint>{'Leave the description field blank if you dont want to show the role'}</Field.Hint>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Scope')}</Field.Label>
				<Field.Row>
					<Controller
						name='scope'
						control={control}
						render={({ field }): ReactElement => <Select {...field} options={options} disabled={isProtected} placeholder={t('Scope')} />}
					/>
				</Field.Row>
			</Field>
			<Field className={className}>
				<Box display='flex' flexDirection='row'>
					<Field.Label>{t('Users must use Two Factor Authentication')}</Field.Label>
					<Field.Row>
						<Controller
							name='mandatory2fa'
							control={control}
							render={({ field }): ReactElement => <ToggleSwitch {...field} checked={field.value} />}
						/>
					</Field.Row>
				</Box>
			</Field>
		</>
	);
};

export default RoleForm;
