import React, { useRef, useMemo } from 'react';
import { Box, Field, TextInput, ToggleSwitch, FieldGroup, RadioButton } from '@rocket.chat/fuselage';

import { capitalize } from '../../helpers/capitalize';
import TemplateComponent from '../../components/TemplateComponent';
import { useTranslation } from '../../contexts/TranslationContext';

const FormTemplate = ({ template, handlers, values, allValues }) => {
	const keys = useRef(Object.keys(values));

	const templateOptions = useMemo(() => ({
		events: keys.current.reduce((acc, key) => {
			acc = { ...acc, [`change [name=${ key }]`]: handlers[`handle${ capitalize(key) }`] };
			return acc;
		}, {}),
	}), [handlers]);

	return <TemplateComponent template={template} get={() => allValues} templateOptions={templateOptions}/>;
};

const CustomFieldsForm = ({ values = {}, handlers = {}, additionalForm }) => {
	const t = useTranslation();

	const {
		field,
		label,
		scope,
		visibility,
		regexp,
		...additionalValues
	} = values;

	const {
		handleField,
		handleLabel,
		handleScope,
		handleVisibility,
		handleRegexp,
		...additionalHandlers
	} = handlers;

	return <FieldGroup>
		<Field>
			<Field.Label>{t('Field')}</Field.Label>
			<Field.Row>
				<TextInput value={field} onChange={handleField} placeholder={t('Field')}/>
			</Field.Row>
		</Field>
		<Field>
			<Field.Label>{t('Label')}</Field.Label>
			<Field.Row>
				<TextInput value={label} onChange={handleLabel} placeholder={t('Label')}/>
			</Field.Row>
		</Field>
		<Field>
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
		<Field>
			<Box display='flex' flexDirection='row'>
				<Field.Label htmlFor='visible'>{t('Visible')}</Field.Label>
				<Field.Row>
					<ToggleSwitch id='visible' checked={visibility} onChange={handleVisibility}/>
				</Field.Row>
			</Box>
		</Field>
		<Field>
			<Field.Label>{t('Validation')}</Field.Label>
			<Field.Row>
				<TextInput value={regexp} onChange={handleRegexp} placeholder={t('Label')}/>
			</Field.Row>
		</Field>
		{ additionalForm && <FormTemplate template={additionalForm} values={additionalValues} handlers={additionalHandlers} allValues={values}/> }
	</FieldGroup>;
};

export default CustomFieldsForm;
