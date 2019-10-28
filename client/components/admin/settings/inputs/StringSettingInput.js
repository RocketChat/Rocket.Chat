import {
	Field,
	Label,
	TextAreaInput,
	TextInput,
} from '@rocket.chat/fuselage';
import React from 'react';

import { ResetSettingButton } from '../ResetSettingButton';

export function StringSettingInput({
	_id,
	label,
	disabled,
	multiline,
	placeholder,
	readonly,
	autocomplete,
	value,
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
			{hasResetButton && <ResetSettingButton onClick={onResetButtonClick} />}
		</Field.Row>
		{multiline
			? <TextAreaInput
				id={_id}
				rows={4}
				value={value}
				placeholder={placeholder}
				disabled={disabled}
				readOnly={readonly}
				autoComplete={autocomplete === false ? 'off' : undefined}
				onChange={handleChange}
			/>
			: <TextInput
				id={_id}
				value={value}
				placeholder={placeholder}
				disabled={disabled}
				readOnly={readonly}
				autoComplete={autocomplete === false ? 'off' : undefined}
				onChange={handleChange}
			/> }
	</>;
}
