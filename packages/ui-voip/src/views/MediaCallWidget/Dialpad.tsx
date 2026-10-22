import { Divider, Box, TextInput, Field, FieldRow } from '@rocket.chat/fuselage';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Keypad from '../../components/Keypad/Keypad';
import { useMediaCallView } from '../../context/MediaCallViewContext';

export type DialpadProps = {
	autoFocus?: boolean;
};

const Dialpad = ({ autoFocus = true }: DialpadProps) => {
	const { t } = useTranslation();
	const { onTone } = useMediaCallView();
	const [inputValue, setInputValue] = useState('');

	return (
		<Box display='flex' width='100%' flexDirection='column' marginBlockEnd={8}>
			<Box display='flex' justifyContent='center' alignItems='center' flexDirection='column'>
				<Field marginBlockEnd={8}>
					<FieldRow>
						<TextInput aria-label={t('Dialpad')} value={inputValue} readOnly small marginInline={24} />
					</FieldRow>
				</Field>
				<Keypad
					autoFocus={autoFocus}
					onKeyPress={(tone) => {
						setInputValue((value) => value + tone);
						onTone(tone);
					}}
				/>
			</Box>
			<Divider />
		</Box>
	);
};

export default Dialpad;
