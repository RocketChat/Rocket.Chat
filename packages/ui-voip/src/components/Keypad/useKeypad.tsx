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

type UseKeypadOptions = {
	// When `true` the keypad is always rendered (expanded) and does not steal focus on mount.
	// Used by the inline (sidebar rail) layout where the dialpad is permanently visible.
	alwaysOpen?: boolean;
};

export const useKeypad = (onPress: (tone: string) => void, { alwaysOpen = false }: UseKeypadOptions = {}): UseKeypad => {
	const [open, setOpen] = useState(false);
	const [inputValue, setInputValue] = useState('');
	const { t } = useTranslation();

	const element = (
		<Box display='flex' justifyContent='center' alignItems='center' width='100%' flexDirection='column' marginBlockEnd={8}>
			<Field marginBlockEnd={8}>
				<FieldRow>
					<TextInput value={inputValue} readOnly small marginInline={24} />
				</FieldRow>
			</Field>
			<Keypad
				autoFocus={!alwaysOpen}
				onKeyPress={(...args) => {
					setInputValue((inputValue) => inputValue + args[0]);
					onPress(...args);
				}}
			/>
			<Divider width='100%' />
		</Box>
	);

	return {
		element: alwaysOpen || open ? element : null,
		buttonProps: {
			title: open ? t('Close_dialpad') : t('Open_dialpad'),
			onClick: () => setOpen((open) => !open),
		},
	};
};
