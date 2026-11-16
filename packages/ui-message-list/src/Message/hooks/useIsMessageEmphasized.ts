import type { IMessage } from '@rocket.chat/core-typings';

import { useIsMessageBeingEdited } from '../contexts/MessageEditingContext';

/** Whether a message is drawn with the editing look: the one the editing context names, being edited or jumped to. */
export const useIsMessageEmphasized = (messageId: IMessage['_id']) => useIsMessageBeingEdited(messageId);
