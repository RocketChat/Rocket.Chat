import {
	Field,
	Label,
	MultiSelectInput,
} from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { ResetSettingButton } from '../ResetSettingButton';

export function MultiSelectSettingInput({
	_id,
	label,
	value = [],
	placeholder,
	readonly,
	autocomplete,
	disabled,
	values = [],
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
	options = [],
}) {
	const t = useTranslation();

	const handleChange = (event) => {
		onChangeValue && onChangeValue([...event.currentTarget.querySelectorAll('option')].filter(e=> e.selected).map(el => el.value));
	};

	return <>
		<Field.Row>
			<Label htmlFor={_id} text={label} title={_id} />
			{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
		</Field.Row>
		<select multiple onChange={handleChange}>
		{
			values.map(({ key, i18nLabel }) => {
				return <option selected={value.includes(key) } value={key}>{t(i18nLabel)}</option>
			})
		}
		</select>
		{/* <MultiSelectInput
			data-qa-setting-id={_id}
			id={_id}
			// value={value}
			placeholder={placeholder}
			disabled={disabled}
			readOnly={readonly}
			autoComplete={autocomplete === false ? 'off' : undefined}
			onChange={handleChange}
			options={options}
		>
			{/* {values.map(({ key, i18nLabel }) =>
				<MultiSelectInput.Option key={key} value={key}>{t(i18nLabel)}</MultiSelectInput.Option>,
			)} 	
		</MultiSelectInput> */}
	</>;
}
