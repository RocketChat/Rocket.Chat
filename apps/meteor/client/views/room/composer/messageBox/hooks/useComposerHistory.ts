import type { Options } from '@rocket.chat/message-parser';
import { useCallback } from 'react';

import { createComposerHistory } from '../../../../../lib/composerHistory';
import { triggerEvent } from '../../../../../lib/createComposerAPICore';
import { renderComposerContent } from '../../../../../lib/messageStateHandler';

export const useComposerHistory = (parseOptions: Options) =>
	useCallback(
		(input: HTMLDivElement) => {
			const history = createComposerHistory({
				input,
				applyState: ({ text, selectionStart, selectionEnd }) => {
					input.innerText = text;
					renderComposerContent(input, parseOptions, { selectionStart, selectionEnd });
					// Untrusted events: skipped by the input renderer (no rerender loop),
					// but keep draft persistence and the React typing state in sync.
					triggerEvent(input, 'input');
					triggerEvent(input, 'change');
					input.focus();
				},
			});

			return () => history.release();
		},
		[parseOptions],
	);
