import { Field, FieldDescription, FieldLabel, FieldRow, Slider } from '@rocket.chat/fuselage';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

export type RangeSettingInputProps = SettingInputProps<number> & {
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
}: RangeSettingInputProps) {
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
					<FieldDescription marginBlockEnd={4}>{hint}</FieldDescription>
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
