import { useEffect, useState } from 'react';

export const useBlockedAction = ({
	url,
}: {
	url?: string;
}): { isBlocked: boolean; handleRetry: () => void; setIsBlocked: (blocked: boolean) => void } => {
	const [isBlocked, setIsBlocked] = useState(false);

	const handleRetry = (): Window | null => window.open(url);

	useEffect(() => {
		if (url && !isBlocked) {
			const handler = window.open(url);
			return setIsBlocked(handler === null);
		}
	}, [url, isBlocked]);

	return { isBlocked, handleRetry, setIsBlocked };
};
