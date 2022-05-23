import { Box, Field, Flex, InputBox } from '@rocket.chat/fuselage';
import React, { FormEventHandler, ReactElement } from 'react';

import ResetSettingButton from '../ResetSettingButton';

type IntSettingInputProps = {
	_id: string;
	label: string;
	value: string;
	placeholder?: string;
	readonly?: boolean;
	autocomplete?: boolean;
	disabled?: boolean;
	hasResetButton?: boolean;
	onChangeValue?: (value: string | number) => void;
	onResetButtonClick?: () => void;
};

function IntSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	onChangeValue,
	hasResetButton,
	onResetButtonClick,
}: IntSettingInputProps): ReactElement {
	const handleChange: FormEventHandler<HTMLInputElement> = (event) => {
		onChangeValue?.(parseInt(event.currentTarget.value, 10));
	};

	return (
		<>
			<Flex.Container>
				<Box>
					<Field.Label htmlFor={_id} title={_id}>
						{label}
					</Field.Label>
					{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
				</Box>
			</Flex.Container>
			<Field.Row>
				<InputBox
					data-qa-setting-id={_id}
					id={_id}
					type='number'
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={handleChange}
				/>
			</Field.Row>
		</>
	);
}

export default IntSettingInput;
