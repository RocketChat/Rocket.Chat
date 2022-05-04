import { useEffect, useState } from 'react';

export const useAutoSequence = <P>(sequence: readonly P[], delay = 700): P => {
	const [index, setIndex] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => setIndex((index) => index + 1), delay);

		return (): void => {
			clearInterval(timer);
		};
	}, [delay]);

	return sequence[index % sequence.length];
};
