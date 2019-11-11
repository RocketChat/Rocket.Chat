import {
	Field,
	Label,
	PasswordInput,
} from '@rocket.chat/fuselage';
import React from 'react';

import { ResetSettingButton } from '../ResetSettingButton';

export function PasswordSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	onChange,
	hasResetButton,
	onResetButtonClick,
}) {
	const handleChange = (event) => {
		const { value } = event.currentTarget;
		onChange({ value });
	};

	return <>
		<Field.Row>
			<Label htmlFor={_id} text={label} title={_id} />
			{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
		</Field.Row>
		<PasswordInput
			data-qa-setting-id={_id}
			value={value}
			placeholder={placeholder}
			disabled={disabled}
			readOnly={readonly}
			autoComplete={autocomplete === false ? 'off' : undefined}
			onChange={handleChange}
		/>
	</>;
}
