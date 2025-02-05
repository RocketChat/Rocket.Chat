import { Field, FieldLabel, FieldRow, InputBox, Select } from '@rocket.chat/fuselage';
import type { FormEventHandler, Key, ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TIMEUNIT, timeUnitToMs, msToTimeUnit } from '../../../../../lib/convertTimeUnit';
import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

type TimespanSettingInputProps = SettingInputProps<string, string | number> & {
	value: string;
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
	placeholder,
	readonly,
	autocomplete,
	disabled,
	required,
	onChangeValue,
	hasResetButton,
	onResetButtonClick,
	packageValue,
}: TimespanSettingInputProps): ReactElement {
	const { t, i18n } = useTranslation();

	const [timeUnit, setTimeUnit] = useState<TIMEUNIT>(getHighestTimeUnit(Number(value)));
	const [internalValue, setInternalValue] = useState<number>(msToTimeUnit(timeUnit, Number(value)));

	const handleChange: FormEventHandler<HTMLInputElement> = (event) => {
		const newValue = sanitizeInputValue(Number(event.currentTarget.value));

		onChangeValue?.(timeUnitToMs(timeUnit, newValue));

		setInternalValue(newValue);
	};

	const handleChangeTimeUnit = (nextTimeUnit: Key) => {
		if (typeof nextTimeUnit !== 'string') {
			return;
		}
		onChangeValue?.(timeUnitToMs(nextTimeUnit as TIMEUNIT, internalValue));
		setTimeUnit(nextTimeUnit as TIMEUNIT);
	};

	const timeUnitOptions = useMemo(() => {
		return Object.entries(TIMEUNIT).map<readonly [TIMEUNIT, string]>(([label, value]) => [value, i18n.exists(label) ? t(label) : label]); // todo translate
	}, [i18n, t]);

	const handleResetButtonClick = () => {
		onResetButtonClick?.();
		const newTimeUnit = getHighestTimeUnit(Number(packageValue));
		setTimeUnit(newTimeUnit);
		setInternalValue(msToTimeUnit(newTimeUnit, Number(packageValue)));
	};

	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={handleResetButtonClick} />}
			</FieldRow>
			<FieldRow>
				<InputBox
					data-qa-setting-id={_id}
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
