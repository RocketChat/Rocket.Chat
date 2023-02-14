import { Box, Field, Flex, TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import type { EventHandler, ReactElement, SyntheticEvent } from 'react';
import React from 'react';

import ResetSettingButton from '../ResetSettingButton';

type StringSettingInputProps = {
	_id: string;
	label: string;
	value?: string;
	multiline?: boolean;
	placeholder?: string;
	readonly?: boolean;
	autocomplete?: boolean;
	disabled?: boolean;
	hasResetButton?: boolean;
	onChangeValue?: (value: string) => void;
	onResetButtonClick?: () => void;
};

function StringSettingInput({
	_id,
	label,
	disabled,
	multiline,
	placeholder,
	readonly,
	autocomplete,
	value,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: StringSettingInputProps): ReactElement {
	const handleChange: EventHandler<SyntheticEvent<HTMLInputElement>> = (event) => {
		onChangeValue?.(event.currentTarget.value);
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
				{multiline ? (
					<TextAreaInput
						data-qa-setting-id={_id}
						id={_id}
						rows={4}
						value={value}
						placeholder={placeholder}
						disabled={disabled}
						readOnly={readonly}
						autoComplete={autocomplete === false ? 'off' : undefined}
						onChange={handleChange}
					/>
				) : (
					<TextInput
						data-qa-setting-id={_id}
						id={_id}
						value={value}
						placeholder={placeholder}
						disabled={disabled}
						readOnly={readonly}
						autoComplete={autocomplete === false ? 'off' : undefined}
						onChange={handleChange}
					/>
				)}
			</Field.Row>
		</>
	);
}

export default StringSettingInput;
