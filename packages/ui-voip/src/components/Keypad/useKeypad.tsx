import { Divider, Box, TextInput, Field, FieldRow } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Keypad from './Keypad';

type UseKeypad = {
	element: ReactNode;
	buttonProps: {
		title: string;
		onClick: () => void;
	};
};

export const useKeypad = (onPress: (tone: string) => void): UseKeypad => {
	const [open, setOpen] = useState(false);
	const [inputValue, setInputValue] = useState('');
	const { t } = useTranslation();

	const element = (
		<Box display='flex' justifyContent='center' alignItems='center' w='100%' flexDirection='column' mbe={8}>
			<Field mbe={8}>
				<FieldRow>
					<TextInput value={inputValue} readOnly small mi={24} />
				</FieldRow>
			</Field>
			<Keypad
				onKeyPress={(...args) => {
					setInputValue((inputValue) => inputValue + args[0]);
					onPress(...args);
				}}
			/>
			<Divider w='100%' />
		</Box>
	);

	return {
		element: open ? element : null,
		buttonProps: {
			title: open ? t('Close_dialpad') : t('Open_dialpad'),
			onClick: () => setOpen((open) => !open),
		},
	};
};
