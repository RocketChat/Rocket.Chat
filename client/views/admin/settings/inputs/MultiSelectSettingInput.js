import { Field, Flex, Box, MultiSelectFiltered, MultiSelect } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import ResetSettingButton from '../ResetSettingButton';

function MultiSelectSettingInput({
	_id,
	label,
	value = [],
	placeholder,
	readonly,
	disabled,
	values = [],
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
	autocomplete,
}) {
	const t = useTranslation();

	const handleChange = (value) => {
		onChangeValue && onChangeValue(value);
		// onChangeValue && onChangeValue([...event.currentTarget.querySelectorAll('option')].filter((e) => e.selected).map((el) => el.value));
	};
	const Component = autocomplete ? MultiSelectFiltered : MultiSelect;
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
			<Component
				data-qa-setting-id={_id}
				id={_id}
				value={value}
				placeholder={placeholder}
				disabled={disabled}
				readOnly={readonly}
				// autoComplete={autocomplete === false ? 'off' : undefined}
				onChange={handleChange}
				options={values.map(({ key, i18nLabel }) => [key, t(i18nLabel)])}
			/>
		</>
	);
}

export default MultiSelectSettingInput;
