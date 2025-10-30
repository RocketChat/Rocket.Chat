import { useState, useEffect, useCallback } from 'react';

import { generatePassphrase } from '../../lib/e2ee/passphrase';

/**
 * A custom hook to generate and manage a passphrase.
 *
 * @returns An object containing the passphrase, loading state, error state, and a function to regenerate the passphrase.
 */
export const usePassphrase = () => {
	const [passphrase, setPassphrase] = useState('');

	// Create a stable, memoized function to fetch the data
	const regenerate = useCallback(async () => {
		try {
			const newPassphrase = await generatePassphrase();
			setPassphrase(newPassphrase);
		} catch (err) {
			console.error('Failed to generate passphrase:', err);
		}
	}, []); // Re-create this function only if the generatorFunction prop changes

	// Fetch the initial passphrase on mount
	useEffect(() => {
		regenerate();
	});

	// Return the state and the function to trigger a refetch
	return passphrase;
};
