import { Box, Field, Flex, UrlInput } from '@rocket.chat/fuselage';
import React from 'react';

import { useAbsoluteUrl } from '../../../../contexts/ServerContext';
import ResetSettingButton from '../ResetSettingButton';

function RelativeUrlSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}) {
	const getAbsoluteUrl = useAbsoluteUrl();

	const handleChange = (event) => {
		onChangeValue && onChangeValue(event.currentTarget.value);
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
			<UrlInput
				data-qa-setting-id={_id}
				id={_id}
				value={getAbsoluteUrl(value)}
				placeholder={placeholder}
				disabled={disabled}
				readOnly={readonly}
				autoComplete={autocomplete === false ? 'off' : undefined}
				onChange={handleChange}
			/>
		</>
	);
}

export default RelativeUrlSettingInput;
