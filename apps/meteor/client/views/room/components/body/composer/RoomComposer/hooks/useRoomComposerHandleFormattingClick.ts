import { RefObject } from 'react';

import { FormattingButton, applyFormattingFromEvent } from '../../../../../../../../app/ui-message/client/messageBox/messageBoxFormatting';

export const useRoomComposerHandleFormattingClick =
	(input: RefObject<HTMLTextAreaElement>): ((action: FormattingButton) => (e: Event) => void) =>
	(action: FormattingButton) =>
	(e) => {
		const { pattern } = action;
		if (pattern && input.current) {
			return applyFormattingFromEvent(e, pattern, input.current);
		}
		return () => undefined;
	};
