import { FieldLabel, MultiSelectFiltered, MultiSelect, Field, FieldRow, FieldHint } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

export type valuesOption = { key: string; i18nLabel: TranslationKey };
type MultiSelectSettingInputProps = SettingInputProps<[string, string], string[]> & {
	values: valuesOption[];
};

function MultiSelectSettingInput({
	_id,
	label,
	value,
	hint,
	placeholder,
	readonly,
	disabled,
	required,
	values = [],
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
	autocomplete,
}: MultiSelectSettingInputProps): ReactElement {
	const { t } = useTranslation();

	const handleChange = (value: string[]): void => {
		onChangeValue?.(value);
		// onChangeValue && onChangeValue([...event.currentTarget.querySelectorAll('option')].filter((e) => e.selected).map((el) => el.value));
	};
	const Component = autocomplete ? MultiSelectFiltered : MultiSelect;
	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton onClick={onResetButtonClick} />}
			</FieldRow>
			<FieldRow>
				<Component
					max-width='full'
					id={_id}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					// autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={handleChange}
					options={values.map(({ key, i18nLabel }) => [key, t(i18nLabel)])}
					aria-label={_id} // FIXME: Multiselect (fuselage) should be associating the FieldLabel automatically. This is a workaround for accessibility and test locators.
				/>
			</FieldRow>
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default MultiSelectSettingInput;
