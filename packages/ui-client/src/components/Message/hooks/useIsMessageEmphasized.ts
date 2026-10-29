import type { IMessage } from '@rocket.chat/core-typings';

import { useIsMessageHighlighted } from '../../MessageList/MessageRowStateContext';
import { useIsMessageBeingEdited } from '../contexts/MessageEditingContext';

/** Whether a message is drawn with the editing look: while the composer edits it, or while a jump to it highlights it. */
export const useIsMessageEmphasized = (messageId: IMessage['_id']) => {
	const isBeingEdited = useIsMessageBeingEdited(messageId);
	const isHighlighted = useIsMessageHighlighted(messageId);
	return isBeingEdited || isHighlighted;
};
