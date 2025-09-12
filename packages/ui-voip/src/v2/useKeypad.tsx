import { Divider, Box } from '@rocket.chat/fuselage';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Keypad } from './components';

type UseKeypad = {
	element: React.ReactNode;
	buttonProps: {
		title: string;
		onClick: () => void;
	};
};

export const useKeypad = (onPress: (tone: string) => void): UseKeypad => {
	const [open, setOpen] = useState(false);
	const { t } = useTranslation();

	const element = useMemo(() => {
		if (!open) {
			return null;
		}
		return (
			<Box display='flex' justifyContent='center' alignItems='center' w='100%' flexDirection='column' mbe={8}>
				<Keypad onKeyPress={onPress} />
				<Divider w='100%' />
			</Box>
		);
	}, [onPress, open]);

	return {
		element,
		buttonProps: {
			title: open ? t('Close_dialpad') : t('Open_dialpad'),
			onClick: () => setOpen((open) => !open),
		},
	};
};
