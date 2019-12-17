import {
	Field,
	InputBox,
	Label,
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
		onChangeValue(event.currentTarget.value);
	};

	const handleEditorTypeChange = (event) => {
		const editor = event.currentTarget.value.trim();
		onChangeEditor(editor);
	};

	return <>
		<div
			style={{
				display: 'flex',
				flexFlow: 'row nowrap',
				margin: '0 -0.5rem',
			}}
		>
			<Field
				style={{
					flex: '2 2 0',
					margin: '0 0.5rem',
				}}
			>
				<Label htmlFor={_id} text={label} title={_id} />
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
					style={{
						width: '100%',
					}}
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
					style={{
						width: '100%',
					}}
				/>}
			</Field>
			<Field
				style={{
					flex: '1 1 0',
					margin: '0 0.5rem',
				}}
			>
				<Field.Row>
					<Label htmlFor={`${ _id }_editor`} text={t('Type')} title={_id} />
					{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
				</Field.Row>
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
			</Field>
		</div>
		<Field.Hint>
			Variable name: {_id.replace(/theme-color-/, '@')}
		</Field.Hint>
	</>;
}
