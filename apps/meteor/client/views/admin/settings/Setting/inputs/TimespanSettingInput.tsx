import { Field, FieldDescription, FieldLabel, FieldRow, InputBox, Select } from '@rocket.chat/fuselage';
import type { ChangeEventHandler, Key } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TIMEUNIT, timeUnitToMs, msToTimeUnit } from '../../../../../lib/convertTimeUnit';
import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

export type TimespanSettingInputProps = SettingInputProps<string, string | number> & {
	value: string;
	timespanBaseUnit?: 'milliseconds' | 'seconds';
};

export const getHighestTimeUnit = (value: number): TIMEUNIT => {
	const minutes = msToTimeUnit(TIMEUNIT.minutes, value);
	if (minutes % 60 !== 0) {
		return TIMEUNIT.minutes;
	}

	const hours = msToTimeUnit(TIMEUNIT.hours, value);
	if (hours % 24 !== 0) {
		return TIMEUNIT.hours;
	}

	return TIMEUNIT.days;
};

const sanitizeInputValue = (value: number) => {
	if (!value) {
		return 0;
	}

	const sanitizedValue = Math.max(0, value).toFixed(0);

	return Number(sanitizedValue);
};

function TimespanSettingInput({
	_id,
	label,
	value,
	hint,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	required,
	onChangeValue,
	hasResetButton,
	onResetButtonClick,
	packageValue,
	timespanBaseUnit = 'milliseconds',
}: TimespanSettingInputProps) {
	const { t, i18n } = useTranslation();

	// the conversion helpers work in milliseconds; settings may persist seconds instead
	const baseUnitFactor = timespanBaseUnit === 'seconds' ? 1000 : 1;

	const [timeUnit, setTimeUnit] = useState<TIMEUNIT>(getHighestTimeUnit(Number(value) * baseUnitFactor));
	const [internalValue, setInternalValue] = useState<number>(msToTimeUnit(timeUnit, Number(value) * baseUnitFactor));

	const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
		const newValue = sanitizeInputValue(Number(event.currentTarget.value));

		onChangeValue?.(timeUnitToMs(timeUnit, newValue) / baseUnitFactor);

		setInternalValue(newValue);
	};

	const handleChangeTimeUnit = (nextTimeUnit: Key) => {
		if (typeof nextTimeUnit !== 'string') {
			return;
		}
		onChangeValue?.(timeUnitToMs(nextTimeUnit as TIMEUNIT, internalValue) / baseUnitFactor);
		setTimeUnit(nextTimeUnit as TIMEUNIT);
	};

	const timeUnitOptions = useMemo(() => {
		return Object.entries(TIMEUNIT).map<readonly [TIMEUNIT, string]>(([label, value]) => [value, i18n.exists(label) ? t(label) : label]); // todo translate
	}, [i18n, t]);

	const handleResetButtonClick = () => {
		onResetButtonClick?.();
		const newTimeUnit = getHighestTimeUnit(Number(packageValue) * baseUnitFactor);
		setTimeUnit(newTimeUnit);
		setInternalValue(msToTimeUnit(newTimeUnit, Number(packageValue) * baseUnitFactor));
	};

	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton onClick={handleResetButtonClick} />}
			</FieldRow>
			{hint && <FieldDescription>{hint}</FieldDescription>}
			<FieldRow>
				<InputBox
					id={_id}
					type='number'
					value={internalValue}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={handleChange}
				/>
			</FieldRow>
			<FieldRow>
				<Select value={timeUnit} disabled={disabled} options={timeUnitOptions} onChange={handleChangeTimeUnit} />
			</FieldRow>
		</Field>
	);
}

export default TimespanSettingInput;
