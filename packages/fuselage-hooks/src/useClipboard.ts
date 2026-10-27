import { useEffect, useState } from 'react';

import { useStableCallback } from './useStableCallback';

export type UseClipboardParams = {
	clearTime?: number;
	onCopySuccess?: (e?: Event) => void;
	onCopyError?: (e?: Error) => void;
};

export type UseClipboardReturn = {
	copy: (e?: Event) => Promise<void>;
	hasCopied: boolean;
};

/**
 * Hook to copy the passed content to the clipboard.
 *
 * @returns an object with the copy function and the hasCopied state
 * @public
 */
export const useClipboard = (
	text: string,
	{ clearTime = 2000, onCopySuccess = (): void => undefined, onCopyError = (): void => undefined }: UseClipboardParams = {},
): UseClipboardReturn => {
	const [hasCopied, setHasCopied] = useState(false);

	const copy = useStableCallback(async (e?: Event) => {
		e?.preventDefault();
		try {
			await navigator.clipboard.writeText(text);
			onCopySuccess(e);
			setHasCopied(true);
		} catch (e) {
			if (e instanceof Error) {
				onCopyError(e);
				return;
			}

			throw e;
		}
	});

	useEffect(() => {
		if (!hasCopied) {
			return;
		}

		const timeout = setTimeout(() => {
			setHasCopied(false);
		}, clearTime);

		return () => clearTimeout(timeout);
	}, [hasCopied, clearTime]);

	return { copy, hasCopied };
};
