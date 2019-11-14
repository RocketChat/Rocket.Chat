import {
	Field,
	Label,
	ToggleSwitch,
} from '@rocket.chat/fuselage';
import React from 'react';

import { ResetSettingButton } from '../ResetSettingButton';

export function BooleanSettingInput({
	_id,
	label,
	disabled,
	readonly,
	autocomplete,
	value,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}) {
	const handleChange = (event) => {
		const value = event.currentTarget.checked;
		onChangeValue(value);
	};

	return <Field.Row>
		<Label position='end' text={label} title={_id}>
			<ToggleSwitch
				data-qa-setting-id={_id}
				value='true'
				checked={value === true}
				disabled={disabled}
				readOnly={readonly}
				autoComplete={autocomplete === false ? 'off' : undefined}
				onChange={handleChange}
			/>
		</Label>
		{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
	</Field.Row>;
}
