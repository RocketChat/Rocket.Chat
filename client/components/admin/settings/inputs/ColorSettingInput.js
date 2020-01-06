import {
	Box,
	Field,
	Flex,
	InputBox,
	Margins,
	MarginsWrapper,
	SelectInput,
	TextInput,
} from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { ResetSettingButton } from '../ResetSettingButton';

export function ColorSettingInput({
	_id,
	label,
	value,
	editor,
	allowedTypes,
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

	const handleChange = (event) => {
		onChangeValue && onChangeValue(event.currentTarget.value);
	};

	const handleEditorTypeChange = (event) => {
		const editor = event.currentTarget.value.trim();
		onChangeEditor && onChangeEditor(editor);
	};

	return <>
		<Flex.Container>
			<Box>
				<Field.Label htmlFor={_id} title={_id}>{label}</Field.Label>
				{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
			</Box>
		</Flex.Container>
		<MarginsWrapper inline='4'>
			<Field.Row>
				<Margins inline='4'>
					<Flex.Item grow={2}>
						{editor === 'color' && <InputBox
							data-qa-setting-id={_id}
							type='color'
							id={_id}
							value={value}
							placeholder={placeholder}
							disabled={disabled}
							readOnly={readonly}
							autoComplete={autocomplete === false ? 'off' : undefined}
							onChange={handleChange}
						/>}
						{editor === 'expression' && <TextInput
							data-qa-setting-id={_id}
							id={_id}
							value={value}
							placeholder={placeholder}
							disabled={disabled}
							readOnly={readonly}
							autoComplete={autocomplete === false ? 'off' : undefined}
							onChange={handleChange}
						/>}
					</Flex.Item>
					<SelectInput
						data-qa-setting-id={`${ _id }_editor`}
						type='color'
						id={`${ _id }_editor`}
						value={editor}
						disabled={disabled}
						readOnly={readonly}
						autoComplete={autocomplete === false ? 'off' : undefined}
						onChange={handleEditorTypeChange}
					>
						{allowedTypes && allowedTypes.map((allowedType) =>
							<SelectInput.Option key={allowedType} value={allowedType}>{t(allowedType)}</SelectInput.Option>,
						)}
					</SelectInput>
				</Margins>
			</Field.Row>
		</MarginsWrapper>
		<Field.Hint>Variable name: {_id.replace(/theme-color-/, '@')}</Field.Hint>
	</>;
}
