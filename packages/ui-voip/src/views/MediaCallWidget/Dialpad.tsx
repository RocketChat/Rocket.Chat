import { Divider, Box, TextInput, Field, FieldRow } from '@rocket.chat/fuselage';
import { useState } from 'react';

import Keypad from '../../components/Keypad/Keypad';
import { useMediaCallView } from '../../context/MediaCallViewContext';

export type DialpadProps = {
	autoFocus?: boolean;
};

const Dialpad = ({ autoFocus = true }: DialpadProps) => {
	const { onTone } = useMediaCallView();
	const [inputValue, setInputValue] = useState('');

	return (
		<Box display='flex' justifyContent='center' alignItems='center' width='100%' flexDirection='column' marginBlockEnd={8}>
			<Field marginBlockEnd={8}>
				<FieldRow>
					<TextInput value={inputValue} readOnly small marginInline={24} />
				</FieldRow>
			</Field>
			<Keypad
				autoFocus={autoFocus}
				onKeyPress={(tone) => {
					setInputValue((value) => value + tone);
					onTone(tone);
				}}
			/>
			<Divider width='100%' />
		</Box>
	);
};

export default Dialpad;
