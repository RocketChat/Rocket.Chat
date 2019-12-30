import {
	Field,
	Label,
	Select,
} from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { ResetSettingButton } from '../ResetSettingButton';

export function SelectSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	// autocomplete,
	disabled,
	values = [],
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}) {
	const t = useTranslation();

	const handleChange = ([value]) => {
		onChangeValue && onChangeValue(value);
	};

	return <>
		<Field.Row>
			<Label htmlFor={_id} text={label} title={_id} />
			{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
		</Field.Row>
		<Select
			data-qa-setting-id={_id}
			id={_id}
			value={value}
			placeholder={placeholder}
			disabled={disabled}
			readOnly={readonly}
			onChange={handleChange}
			option={values.map(({ key, i18nLabel }) => [key, t(i18nLabel)],
			)}
		/>
	</>;
}
