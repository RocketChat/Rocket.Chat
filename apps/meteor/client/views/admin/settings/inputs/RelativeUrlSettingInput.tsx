import { Box, FieldLabel, Flex, UrlInput } from '@rocket.chat/fuselage';
import { useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import type { EventHandler, ReactElement, SyntheticEvent } from 'react';
import React from 'react';

import ResetSettingButton from '../ResetSettingButton';

type RelativeUrlSettingInputProps = {
	_id: string;
	label: string;
	value?: string;
	placeholder?: string;
	readonly?: boolean;
	autocomplete?: boolean;
	disabled?: boolean;
	hasResetButton?: boolean;
	onChangeValue?: (value: string) => void;
	onResetButtonClick?: () => void;
};

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
}: RelativeUrlSettingInputProps): ReactElement {
	const getAbsoluteUrl = useAbsoluteUrl();

	const handleChange: EventHandler<SyntheticEvent<HTMLInputElement>> = (event) => {
		onChangeValue?.(event.currentTarget.value);
	};

	return (
		<>
			<Flex.Container>
				<Box>
					<FieldLabel htmlFor={_id} title={_id}>
						{label}
					</FieldLabel>
					{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
				</Box>
			</Flex.Container>
			<UrlInput
				data-qa-setting-id={_id}
				id={_id}
				value={getAbsoluteUrl(value || '')}
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
