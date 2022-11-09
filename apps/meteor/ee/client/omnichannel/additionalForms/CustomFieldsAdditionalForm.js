import { Box, Field, TextInput, ToggleSwitch, Select } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

const CustomFieldsAdditionalForm = ({ values = {}, handlers = {}, state, className, errors }) => {
	const t = useTranslation();

	const { type, required, defaultValue, options, public: isPublic } = values;

	const { handleType, handleRequired, handleDefaultValue, handleOptions, handlePublic } = handlers;

	const { optionsError } = errors;

	const typeOptions = useMemo(
		() => [
			['input', t('Input')],
			['select', t('Select')],
		],
		[t],
	);

	return (
		<>
			<Field className={className}>
				<Box display='flex' flexDirection='row'>
					<Field.Label htmlFor='required'>{t('Required')}</Field.Label>
					<Field.Row>
						<ToggleSwitch id='required' checked={required} onChange={handleRequired} />
					</Field.Row>
				</Box>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Type')}</Field.Label>
				<Field.Row>
					<Select options={typeOptions} value={type} onChange={handleType} />
				</Field.Row>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Default_value')}</Field.Label>
				<Field.Row>
					<TextInput value={defaultValue} onChange={handleDefaultValue} placeholder={t('Default_value')} />
				</Field.Row>
			</Field>
			<Field className={className}>
				<Field.Label>{t('Options')}</Field.Label>
				<Field.Row>
					<TextInput value={options} onChange={handleOptions} error={optionsError} disabled={type === 'input'} placeholder={t('Options')} />
				</Field.Row>
				<Field.Hint>{t('Livechat_custom_fields_options_placeholder')}</Field.Hint>
				{optionsError && <Field.Error>{optionsError}</Field.Error>}
			</Field>
			<Field className={className}>
				<Box display='flex' flexDirection='row'>
					<Field.Label htmlFor='public'>{t('Public')}</Field.Label>
					<Field.Row>
						<ToggleSwitch disabled={!state.visibility} id='public' checked={isPublic} onChange={handlePublic} />
					</Field.Row>
				</Box>
				<Field.Hint>{t('Livechat_custom_fields_public_description')}</Field.Hint>
			</Field>
		</>
	);
};

export default CustomFieldsAdditionalForm;
