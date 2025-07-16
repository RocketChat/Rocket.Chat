import type { SettingValueRoomPick } from '@rocket.chat/core-typings';
import { Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import RoomAutoCompleteMultiple from '../../../../../components/RoomAutoCompleteMultiple';
import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

type RoomPickSettingInputProps = SettingInputProps<SettingValueRoomPick | '', SettingValueRoomPick>;

function RoomPickSettingInput({
	_id,
	label,
	value,
	placeholder,
	readonly,
	disabled,
	required,
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
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
			</FieldRow>
			<FieldRow>
				<RoomAutoCompleteMultiple
					readOnly={readonly}
					placeholder={placeholder}
					disabled={disabled}
					value={parsedValue}
					onChange={handleChange}
				/>
			</FieldRow>
		</Field>
	);
}

export default RoomPickSettingInput;
