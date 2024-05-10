import { useCallback } from 'react';

import { InvalidUrlError } from '../lib/errors/InvalidUrlError';

export const useExternalLink = () => {
	return useCallback((url: string | undefined) => {
		if (!url) {
			throw new InvalidUrlError();
		}
		window.open(url, '_blank', 'noopener noreferrer');
	}, []);
};
