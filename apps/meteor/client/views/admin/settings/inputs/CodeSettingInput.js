import { Box, Button, Field, Flex } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import ResetSettingButton from '../ResetSettingButton';
import CodeMirror from './CodeMirror';

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
}) {
	const t = useTranslation();

	const [fullScreen, toggleFullScreen] = useToggle(false);

	const handleChange = (value) => {
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
					<Button primary onClick={() => toggleFullScreen()}>
						{fullScreen ? t('Exit_Full_Screen') : t('Full_Screen')}
					</Button>
				</div>
			</div>
		</>
	);
}

export default CodeSettingInput;
