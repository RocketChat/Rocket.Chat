import { Box, Field, FieldHint, FieldLabel, FieldRow, Icon, IconButton, PasswordInput } from '@rocket.chat/fuselage';
import type { EventHandler, ReactElement, SyntheticEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ResetSettingButton from '../ResetSettingButton';
import type { SettingInputProps } from './types';

type PasswordSettingInputProps = SettingInputProps<string | number | readonly string[] | undefined>;

function PasswordSettingInput({
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
	hasValue,
	onChangeValue,
	onResetButtonClick,
}: PasswordSettingInputProps): ReactElement {
	const { t } = useTranslation();

	// A setting is "configured and masked" when the server reports a value exists but sends '' as the value.
	const isServerMasked = hasValue === true && value === '';

	const [editing, setEditing] = useState(!isServerMasked);
	const startedFromMasked = useRef(false);

	// When the server pushes a fresh masked value (e.g. after save or reset), return to configured state.
	useEffect(() => {
		if (hasValue === true && value === '') {
			setEditing(false);
			startedFromMasked.current = false;
		}
	}, [value, hasValue]);

	const handleChange: EventHandler<SyntheticEvent<HTMLInputElement>> = (event) => {
		onChangeValue?.(event.currentTarget.value);
	};

	const handleEditClick = () => {
		startedFromMasked.current = true;
		setEditing(true);
	};

	const handleCancelClick = () => {
		startedFromMasked.current = false;
		setEditing(false);
		onChangeValue?.('');
	};

	return (
		<Field>
			<FieldRow>
				<FieldLabel htmlFor={_id} title={_id} required={required}>
					{label}
				</FieldLabel>
				{hasResetButton && <ResetSettingButton onClick={onResetButtonClick} />}
			</FieldRow>
			{!editing && isServerMasked ? (
				<>
					<FieldRow>
						<Box flexGrow={1} title={t('Secret_field_hint')}>
							<PasswordInput
								id={_id}
								value='••••••••'
								disabled
								readOnly
								placeholder={placeholder}
								addon={<Icon name='lock' size='x16' color='hint' />}
							/>
						</Box>
						<IconButton
							small
							mis={8}
							icon='pencil'
							disabled={disabled || readonly}
							title={t('Edit_secret_value')}
							onClick={handleEditClick}
						/>
					</FieldRow>
				</>
			) : (
				<FieldRow>
					<PasswordInput
						id={_id}
						value={value}
						placeholder={placeholder}
						disabled={disabled}
						readOnly={readonly}
						autoComplete={autocomplete === false ? 'new-password' : undefined}
						onChange={handleChange}
					/>
					{startedFromMasked.current && (
						<IconButton small mis={8} icon='cross' disabled={disabled} title={t('Cancel')} onClick={handleCancelClick} />
					)}
				</FieldRow>
			)}
			{hint && <FieldHint>{hint}</FieldHint>}
		</Field>
	);
}

export default PasswordSettingInput;
