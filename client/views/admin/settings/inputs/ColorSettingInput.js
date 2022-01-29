import { Box, Field, Flex, InputBox, Margins, TextInput, Select } from '@rocket.chat/fuselage';
import React, { useCallback } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import ResetSettingButton from '../ResetSettingButton';

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
}) {
	const t = useTranslation();

	const handleChange = useCallback(
		(event) => {
			onChangeValue && onChangeValue(event.currentTarget.value);
		},
		[onChangeValue],
	);

	const handleEditorTypeChange = useCallback(
		(value) => {
			onChangeEditor && onChangeEditor(value);
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
