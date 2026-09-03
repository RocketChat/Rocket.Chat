import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import type { Options } from '@rocket.chat/message-parser';
import { useCallback } from 'react';

import { createComposerHistory } from '../../../../../../app/ui-message/client/messageBox/composerHistory';
import { triggerEvent } from '../../../../../../app/ui-message/client/messageBox/createComposerAPICore';
import { renderComposerContent } from '../../../../../../app/ui-message/client/messageBox/messageStateHandler';

export const useComposerHistory = (parseOptions: Options) =>
	useSafeRefCallback(
		useCallback(
			(node: HTMLElement | null) => {
				if (node === null) {
					return;
				}

				const input = node as HTMLDivElement;
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
		),
	);
