import type { IMessage } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import type { MessageWithMdEnforced } from '../../../lib/parseMessageTextToAstMarkdown';
import { useMessageListNormalizer } from '../list/MessageListContext';

/**
 * Returns the message ready to render: markdown text parsed to an AST per the room's
 * display settings, and encrypted file attachments pointed at `/file-decrypt`.
 * Needed because the stored message holds raw text and ciphertext URLs, which the UI can't show as-is.
 */
export const useNormalizedMessage = <TMessage extends IMessage>(message: TMessage): MessageWithMdEnforced => {
	const normalize = useMessageListNormalizer();

	return useMemo(() => normalize(message), [normalize, message]);
};
