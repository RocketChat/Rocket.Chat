import type { SettingValueRoomPick } from '@rocket.chat/core-typings';
import { Box, FieldLabel, FieldRow, Flex } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import RoomAutoCompleteMultiple from '../../../../components/RoomAutoCompleteMultiple';
import ResetSettingButton from '../ResetSettingButton';

type RoomPickSettingInputProps = {
	_id: string;
	label: string;
	value?: SettingValueRoomPick | '';
	placeholder?: string;
	readonly?: boolean;
	disabled?: boolean;
	hasResetButton?: boolean;
	onChangeValue: (value: SettingValueRoomPick) => void;
	onResetButtonClick?: () => void;
};

function RoomPickSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	disabled,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: RoomPickSettingInputProps): ReactElement {
	const parsedValue = (value || []).map(({ _id }) => _id);

	const handleChange = (value: string | string[]) => {
		if (typeof value === 'object') {
			const newValue = value.map((currentValue: string) => ({ _id: currentValue }));
			onChangeValue(newValue);
		}
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
			<FieldRow>
				<RoomAutoCompleteMultiple
					readOnly={readonly}
					placeholder={placeholder}
					disabled={disabled}
					value={parsedValue}
					onChange={handleChange}
				/>
			</FieldRow>
		</>
	);
}

export default RoomPickSettingInput;
