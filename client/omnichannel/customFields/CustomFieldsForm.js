import React from 'react';
import { Box, Field, TextInput, ToggleSwitch, RadioButton } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';

const CustomFieldsForm = ({ values = {}, handlers = {}, className }) => {
	const t = useTranslation();

	const {
		field,
		label,
		scope,
		visibility,
		regexp,
	} = values;

	const {
		handleField,
		handleLabel,
		handleScope,
		handleVisibility,
		handleRegexp,
	} = handlers;

	return <>
		<Field className={className}>
			<Field.Label>{t('Field')}</Field.Label>
			<Field.Row>
				<TextInput value={field} onChange={handleField} placeholder={t('Field')}/>
			</Field.Row>
		</Field>
		<Field className={className}>
			<Field.Label>{t('Label')}</Field.Label>
			<Field.Row>
				<TextInput value={label} onChange={handleLabel} placeholder={t('Label')}/>
			</Field.Row>
		</Field>
		<Field className={className}>
			<Field.Label>{t('Scope')}</Field.Label>
			<Field.Row>
				{t('Visitor')}
				<RadioButton value='visitor' name='scope' checked={scope === 'visitor'} onChange={() => handleScope('visitor')}/>
			</Field.Row>
			<Field.Row>
				{t('Room')}
				<RadioButton value='room' name='scope' checked={scope === 'room'} onChange={() => handleScope('room')}/>
			</Field.Row>
		</Field>
		<Field className={className}>
			<Box display='flex' flexDirection='row'>
				<Field.Label htmlFor='visible'>{t('Visible')}</Field.Label>
				<Field.Row>
					<ToggleSwitch id='visible' checked={visibility} onChange={handleVisibility}/>
				</Field.Row>
			</Box>
		</Field>
		<Field className={className}>
			<Field.Label>{t('Validation')}</Field.Label>
			<Field.Row>
				<TextInput value={regexp} onChange={handleRegexp} placeholder={t('Label')}/>
			</Field.Row>
		</Field>
	</>;
};

export default CustomFieldsForm;
