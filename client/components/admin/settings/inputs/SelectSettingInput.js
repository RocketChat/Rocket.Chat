import {
	Field,
	Label,
	SelectInput,
} from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../providers/TranslationProvider';
import { ResetSettingButton } from '../ResetSettingButton';

export function SelectSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	values,
	onChange,
	hasResetButton,
	onResetButtonClick,
}) {
	const t = useTranslation();

	const handleChange = (event) => {
		const { value } = event.currentTarget;
		onChange({ value });
	};

	return <>
		<Field.Row>
			<Label htmlFor={_id} text={label} title={_id} />
			{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
		</Field.Row>
		<SelectInput
			data-qa-setting-id={_id}
			value={value}
			placeholder={placeholder}
			disabled={disabled}
			readOnly={readonly}
			autoComplete={autocomplete === false ? 'off' : undefined}
			onChange={handleChange}
		>
			{values.map(({ key, i18nLabel }) =>
				<SelectInput.Option key={key} value={key}>{t(i18nLabel)}</SelectInput.Option>
			)}
		</SelectInput>
	</>;
}
