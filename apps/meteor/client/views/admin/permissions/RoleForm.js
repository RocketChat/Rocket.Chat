import { Box, Field, TextInput, Select, ToggleSwitch } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

const RoleForm = ({ values, handlers, className, errors, editing = false, isProtected = false }) => {
	const t = useTranslation();

	const { name, description, scope, mandatory2fa } = values;

	const { handleName, handleDescription, handleScope, handleMandatory2fa } = handlers;

	const options = useMemo(
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
					<TextInput disabled={editing} value={name} onChange={handleName} placeholder={t('Role')} />
				</Field.Row>
				<Field.Error>{errors?.name}</Field.Error>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Description')}</Field.Label>
				<Field.Row>
					<TextInput value={description} onChange={handleDescription} placeholder={t('Description')} />
				</Field.Row>
				<Field.Hint>{'Leave the description field blank if you dont want to show the role'}</Field.Hint>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Scope')}</Field.Label>
				<Field.Row>
					<Select disabled={isProtected} options={options} value={scope} onChange={handleScope} placeholder={t('Scope')} />
				</Field.Row>
			</Field>
			<Field className={className}>
				<Box display='flex' flexDirection='row'>
					<Field.Label>{t('Users must use Two Factor Authentication')}</Field.Label>
					<Field.Row>
						<ToggleSwitch checked={mandatory2fa} onChange={handleMandatory2fa} />
					</Field.Row>
				</Box>
			</Field>
		</>
	);
};

export default RoleForm;
