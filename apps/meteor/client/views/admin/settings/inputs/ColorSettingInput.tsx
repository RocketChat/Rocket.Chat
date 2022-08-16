import { Box, Field, Flex, InputBox, Margins, TextInput, Select } from '@rocket.chat/fuselage';
import { useTranslation, TranslationKey } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback } from 'react';

import ResetSettingButton from '../ResetSettingButton';

type ColorSettingInputProps = {
	_id: string;
	label: string;
	value: string;
	editor: string;
	allowedTypes?: TranslationKey[];
	placeholder?: string;
	readonly?: boolean;
	autocomplete?: boolean;
	disabled?: boolean;
	hasResetButton?: boolean;
	onChangeValue?: (value: string) => void;
	onChangeEditor?: (value: string) => void;
	onResetButtonClick?: () => void;
};
function ColorSettingInput({
	_id,
	label,
	value,
	editor,
	allowedTypes = [],
	placeholder,
	readonly,
	autocomplete,
	disabled,
	hasResetButton,
	onChangeValue,
	onChangeEditor,
	onResetButtonClick,
}: ColorSettingInputProps): ReactElement {
	const t = useTranslation();

	const handleChange = useCallback(
		(event) => {
			onChangeValue?.(event.currentTarget.value);
		},
		[onChangeValue],
	);

	const handleEditorTypeChange = useCallback(
		(value) => {
			onChangeEditor?.(value);
		},
		[onChangeEditor],
	);

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
			<Margins inline='x4'>
				<Field.Row>
					<Margins inline='x4'>
						<Flex.Item grow={2}>
							{editor === 'color' && (
								<InputBox
									data-qa-setting-id={_id}
									type='color'
									id={_id}
									value={value}
									placeholder={placeholder}
									disabled={disabled}
									readOnly={readonly}
									autoComplete={autocomplete === false ? 'off' : undefined}
									onChange={handleChange}
								/>
							)}
							{editor === 'expression' && (
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
						</Flex.Item>
						<Select
							data-qa-setting-id={`${_id}_editor`}
							type='color'
							id={`${_id}_editor`}
							value={editor}
							disabled={disabled}
							readOnly={readonly}
							autoComplete={autocomplete === false ? 'off' : undefined}
							onChange={handleEditorTypeChange}
							options={allowedTypes.map((type) => [type, t(type)])}
						/>
					</Margins>
				</Field.Row>
			</Margins>
			<Field.Hint>Variable name: {_id.replace(/theme-color-/, '@')}</Field.Hint>
		</>
	);
}

export default ColorSettingInput;
