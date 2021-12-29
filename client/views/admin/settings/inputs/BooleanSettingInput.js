import { Field, ToggleSwitch } from '@rocket.chat/fuselage';
import React from 'react';

import ResetSettingButton from '../ResetSettingButton';

function BooleanSettingInput({ _id, label, disabled, readonly, value, hasResetButton, onChangeValue, onResetButtonClick }) {
	const handleChange = (event) => {
		const value = event.currentTarget.checked;
		onChangeValue && onChangeValue(value);
	};

	return (
		<Field.Row>
			<ToggleSwitch
				data-qa-setting-id={_id}
				id={_id}
				value='true'
				checked={value === true}
				disabled={disabled}
				readOnly={readonly}
				onChange={handleChange}
			/>
			<Field.Label htmlFor={_id} title={_id}>
				{label}
			</Field.Label>
			{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
		</Field.Row>
	);
}

export default BooleanSettingInput;
