import { useLayout, useUserPreference } from '@rocket.chat/ui-contexts';
import { KeyboardEventHandler, useCallback } from 'react';

import { keyCodes } from '../../../../../../lib/utils/keyCodes';

/**
 * Given a setting, executes the callback the user presses the enter key
 * @param cb
 * @returns
 */

export const useMessageComposerHandleSubmit = (
	cb: KeyboardEventHandler<HTMLTextAreaElement>,
): KeyboardEventHandler<HTMLTextAreaElement> => {
	const { isMobile } = useLayout();
	const sendOnEnterBehavior = useUserPreference<'normal' | 'alternative' | 'desktop'>('sendOnEnter') || isMobile;
	const sendOnEnter = sendOnEnterBehavior == null || sendOnEnterBehavior === 'normal' || (sendOnEnterBehavior === 'desktop' && !isMobile);

	return useCallback<KeyboardEventHandler<HTMLTextAreaElement>>(
		(event) => {
			const { which: keyCode } = event;

			const isSubmitKey = keyCode === keyCodes.CARRIAGE_RETURN || keyCode === keyCodes.NEW_LINE;

			if (!isSubmitKey) {
				return false;
			}

			const withModifier = event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
			const isSending = (sendOnEnter && !withModifier) || (!sendOnEnter && withModifier);

			if (!isSending) {
				return false;
			}
			event.preventDefault();
			cb(event);
			return true;
		},
		[cb, sendOnEnter],
	);
};
