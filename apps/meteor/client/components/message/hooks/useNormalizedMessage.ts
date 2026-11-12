import type { IMessage } from '@rocket.chat/core-typings';
import { useMessageContent } from '@rocket.chat/ui-message-list';

import type { MessageWithMdEnforced } from '../../../lib/parseMessageTextToAstMarkdown';

/** A message as it is displayed, parsed with the options of the place that shows it. */
export const useNormalizedMessage = <TMessage extends IMessage>(message: TMessage): MessageWithMdEnforced =>
	useMessageContent().useNormalizedMessage<IMessage>(message);
