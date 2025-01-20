import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

export const useCurrent = (currentInitialValue = 0): [number, Dispatch<SetStateAction<number>>] => {
	const [current, setCurrent] = useState<number>(currentInitialValue);

	return [current, setCurrent];
};
