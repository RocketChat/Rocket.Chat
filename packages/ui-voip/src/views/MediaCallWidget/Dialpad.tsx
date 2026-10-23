import { Divider, Box, TextInput, Field, FieldRow, Stack } from '@rocket.chat/fuselage';
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
			<Stack justify='center' align='center' gap={8}>
				<Box width='full' paddingInline={24}>
					<Field>
						<FieldRow>
							<TextInput aria-label={t('Dialpad')} value={inputValue} readOnly small />
						</FieldRow>
					</Field>
				</Box>
				<Keypad
					autoFocus={autoFocus}
					onKeyPress={(tone) => {
						setInputValue((value) => value + tone);
						onTone(tone);
					}}
				/>
			</Stack>
			<Divider />
		</Box>
	);
};

export default Dialpad;
