import { Divider, Box } from '@rocket.chat/fuselage';
import { useMemo, useState } from 'react';

import { Keypad } from './components';

type UseKeypad = {
	element: React.ReactNode;
	toggleOpen: () => void;
};

export const useKeypad = (onPress: (tone: string) => void): UseKeypad => {
	const [open, setOpen] = useState(false);

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
		toggleOpen: () => setOpen((open) => !open),
	};
};
