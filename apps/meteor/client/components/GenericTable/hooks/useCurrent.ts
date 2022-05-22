import { useState } from 'react';

export const useCurrent = (currentInitialValue = 0): [number, React.Dispatch<React.SetStateAction<number>>] => {
	const [current, setCurrent] = useState<number>(currentInitialValue);

	return [current, setCurrent];
};
