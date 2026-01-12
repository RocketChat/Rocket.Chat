import { Field, FieldHint, FieldLabel, FieldRow, UrlInput } from '@rocket.chat/fuselage';
import { useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import type { EventHandler, ReactElement, SyntheticEvent } from 'react';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

type RelativeUrlSettingInputProps = SettingInputProps;

function RelativeUrlSettingInput({
	_id,
	label,
	value,
	hint,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	required,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: RelativeUrlSettingInputProps): ReactElement {
	const getAbsoluteUrl = useAbsoluteUrl();

	const handleChange: EventHandler<SyntheticEvent<HTMLInputElement>> = (event) => {
		onChangeValue?.(event.currentTarget.value);
	};

	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton onClick={onResetButtonClick} />}
			</FieldRow>
			<UrlInput
				id={_id}
				value={getAbsoluteUrl(value || '')}
				placeholder={placeholder}
				disabled={disabled}
				readOnly={readonly}
				autoComplete={autocomplete === false ? 'off' : undefined}
				onChange={handleChange}
			/>
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default RelativeUrlSettingInput;
