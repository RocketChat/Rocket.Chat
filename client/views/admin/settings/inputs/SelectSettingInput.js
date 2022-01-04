import { Box, Field, Flex, Select } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import ResetSettingButton from '../ResetSettingButton';

function SelectSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	values = [],
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}) {
	const t = useTranslation();

	const handleChange = (value) => {
		onChangeValue && onChangeValue(value);
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
				<Select
					data-qa-setting-id={_id}
					id={_id}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={handleChange}
					options={values.map(({ key, i18nLabel }) => [key, t(i18nLabel)])}
				/>
			</Field.Row>
		</>
	);
}

export default SelectSettingInput;
