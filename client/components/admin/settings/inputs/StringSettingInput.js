import { Box, Field, Flex, TextAreaInput, TextInput, Icon, Callout, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { ResetSettingButton } from '../ResetSettingButton';

export function Input({ hint, callout, ...props }) {
	return <Field>
		<StringSettingInput {...props} />
		{hint && <Field.Hint>{hint}</Field.Hint>}
		{callout && <Margins block='x16'>
			<Callout type='warning'>{callout}</Callout></Margins>}
	</Field>;
}

export function StringSettingInput({
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
	addon,
	...props
}) {
	const handleChange = (event) => {
		onChangeValue(event.currentTarget.value);
	};

	return <>
		<Flex.Container>
			<Box>
				<Field.Label htmlFor={_id} title={_id}>{label}</Field.Label>
				{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
			</Box>
		</Flex.Container>
		<Field.Row>
			{multiline
				? <TextAreaInput
					data-qa-setting-id={_id}
					id={_id}
					rows={4}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={handleChange}
					{ ...addon && { addon: <Icon name={addon} size='20' /> }}
					{ ...props }
				/>
				: <TextInput
					data-qa-setting-id={_id}
					id={_id}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={handleChange}
					{ ...addon && { addon: <Icon name={addon} size='20' /> }}
					{ ...props }
				/> }
		</Field.Row>
	</>;
}

Input.displayName = 'Input';
