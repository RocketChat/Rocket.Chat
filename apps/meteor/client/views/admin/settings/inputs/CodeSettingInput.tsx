import { Box, Button, Field, Flex } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import ResetSettingButton from '../ResetSettingButton';
import CodeMirror from './CodeMirror';

type CodeSettingInputProps = {
	_id: string;
	label: string;
	value?: string;
	code: string;
	placeholder?: string;
	readonly: boolean;
	autocomplete: boolean;
	disabled: boolean;
	hasResetButton: boolean;
	onChangeValue: (value: string) => void;
	onResetButtonClick: () => void;
};

function CodeSettingInput({
	_id,
	label,
	value = '',
	code,
	placeholder,
	readonly,
	autocomplete,
	disabled,
	hasResetButton,
	onChangeValue,
	onResetButtonClick,
}: CodeSettingInputProps): ReactElement {
	const t = useTranslation();

	const [fullScreen, toggleFullScreen] = useToggle(false);

	const handleChange = (value: string): void => {
		onChangeValue(value);
	};

	return (
		<>
			<Flex.Container>
				<Box>
					<Field.Label htmlFor={_id} title={_id}>
						{label}
					</Field.Label>
					{hasResetButton && <ResetSettingButton data-qa-reset-setting-id={_id} onClick={onResetButtonClick} />}
				</Box>
			</Flex.Container>
			<div className={['code-mirror-box', fullScreen && 'code-mirror-box-fullscreen content-background-color'].filter(Boolean).join(' ')}>
				<div className='title'>{label}</div>
				<CodeMirror
					data-qa-setting-id={_id}
					id={_id}
					mode={code}
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					readOnly={readonly}
					autoComplete={autocomplete === false ? 'off' : undefined}
					onChange={handleChange}
				/>
				<div className='buttons'>
					<Button primary onClick={(): void => toggleFullScreen()}>
						{fullScreen ? t('Exit_Full_Screen') : t('Full_Screen')}
					</Button>
				</div>
			</div>
		</>
	);
}

export default CodeSettingInput;
