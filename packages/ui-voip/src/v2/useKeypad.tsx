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
		return <Keypad onKeyPress={onPress} />;
	}, [onPress, open]);

	return {
		element,
		toggleOpen: () => setOpen((open) => !open),
	};
};
