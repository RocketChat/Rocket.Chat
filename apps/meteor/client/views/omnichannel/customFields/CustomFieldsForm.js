import { Box, Field, TextInput, ToggleSwitch, Select } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

const CustomFieldsForm = ({ values = {}, handlers = {}, className }) => {
	const t = useTranslation();

	const { id, field, label, scope, visibility, regexp } = values;

	const { handleField, handleLabel, handleScope, handleVisibility, handleRegexp } = handlers;

	const scopeOptions = useMemo(
		() => [
			['visitor', t('Visitor')],
			['room', t('Room')],
		],
		[t],
	);

	return (
		<>
			<Field className={className}>
				<Field.Label>{t('Field')}*</Field.Label>
				<Field.Row>
					<TextInput disabled={id} value={field} onChange={handleField} placeholder={t('Field')} />
				</Field.Row>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Label')}*</Field.Label>
				<Field.Row>
					<TextInput value={label} onChange={handleLabel} placeholder={t('Label')} />
				</Field.Row>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Scope')}</Field.Label>
				<Field.Row>
					<Select options={scopeOptions} value={scope} onChange={handleScope} />
				</Field.Row>
			</Field>
			<Field className={className}>
				<Box display='flex' flexDirection='row'>
					<Field.Label htmlFor='visible'>{t('Visible')}</Field.Label>
					<Field.Row>
						<ToggleSwitch id='visible' checked={visibility} onChange={handleVisibility} />
					</Field.Row>
				</Box>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Validation')}</Field.Label>
				<Field.Row>
					<TextInput value={regexp} onChange={handleRegexp} placeholder={t('Validation')} />
				</Field.Row>
			</Field>
		</>
	);
};

export default CustomFieldsForm;
