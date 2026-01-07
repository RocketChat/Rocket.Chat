import { Slider, Field, FieldLabel, FieldRow, FieldHint } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

type RangeSettingInputProps = SettingInputProps<number> & {
	hint?: string;
	minValue?: number;
	maxValue?: number;
};

function RangeSettingInput({
	_id,
	label,
	hint,
	value,
	minValue = 0,
	maxValue = 100,
	readonly,
	disabled,
	required,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: RangeSettingInputProps): ReactElement {
	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton onClick={onResetButtonClick} />}
			</FieldRow>
			{hint && (
				<FieldRow>
					<FieldHint mbe={4}>{hint}</FieldHint>
				</FieldRow>
			)}
			<FieldRow>
				<Slider
					disabled={disabled || readonly}
					minValue={minValue}
					maxValue={maxValue}
					value={Number(value || 0)}
					onChange={onChangeValue}
				/>
			</FieldRow>
		</Field>
	);
}

export default RangeSettingInput;
