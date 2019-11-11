import {
	Field,
	Label,
	InputBox,
} from '@rocket.chat/fuselage';
import React from 'react';

import { ResetSettingButton } from '../ResetSettingButton';

export function IntSettingInput({
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
		const value = parseInt(event.currentTarget.value, 10);
		onChange({ value });
	};

	return <>
		<Field.Row>
			<Label htmlFor={_id} text={label} title={_id} />
			{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
		</Field.Row>
		<InputBox
			data-qa-setting-id={_id}
			type='number'
			value={value}
			placeholder={placeholder}
			disabled={disabled}
			readOnly={readonly}
			autoComplete={autocomplete === false ? 'off' : undefined}
			onChange={handleChange}
		/>
	</>;
}
