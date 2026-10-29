import { useEffect, useState } from 'react';

import type { ErrorReportSource } from '../../lib/errorReport';
import { buildErrorReport } from '../../lib/errorReport';

const COPIED_FEEDBACK_MS = 2000;

const writeToClipboard = async (text: string): Promise<void> => {
	// The async Clipboard API only exists in secure contexts
	if (navigator.clipboard) {
		await navigator.clipboard.writeText(text);
		return;
	}

	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.setAttribute('readonly', '');
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';
	document.body.appendChild(textarea);
	textarea.select();

	try {
		// execCommand is deprecated, but this is a fallback
		if (!document.execCommand('copy')) {
			throw new Error('Copy command was rejected');
		}
	} finally {
		document.body.removeChild(textarea);
	}
};

/** Copies a support-ready report of the error to the clipboard, so users without devtools can share it. */
export const useCopyErrorReport = (source: ErrorReportSource) => {
	const [hasCopied, setHasCopied] = useState(false);

	useEffect(() => {
		if (!hasCopied) {
			return;
		}

		const timeout = setTimeout(() => setHasCopied(false), COPIED_FEEDBACK_MS);
		return () => clearTimeout(timeout);
	}, [hasCopied]);

	const copy = async () => {
		try {
			await writeToClipboard(buildErrorReport(source));
			setHasCopied(true);
		} catch (error) {
			console.error('Failed to copy the error report', error);
		}
	};

	return { copy, hasCopied };
};
