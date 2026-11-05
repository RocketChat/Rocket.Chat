import type { IMessage } from '@rocket.chat/core-typings';
import { isTruthy } from '@rocket.chat/tools';
import type {
	MessageActionConfig,
	MessageDisplayContextValue,
	MessageToolbarContextValue,
	MessageToolbarScope,
} from '@rocket.chat/ui-message-list';
import { useContext, useMemo } from 'react';

import { useCopyAction } from './actions/useCopyAction';
import { useDeleteMessageAction } from './actions/useDeleteMessageAction';
import { useEditMessageAction } from './actions/useEditMessageAction';
import { useFollowMessageAction } from './actions/useFollowMessageAction';
import { useMarkAsUnreadMessageAction } from './actions/useMarkAsUnreadMessageAction';
import { useMessageActionAppsActionButtons } from './actions/useMessageActionAppsActionButtons';
import { useNewDiscussionMessageAction } from './actions/useNewDiscussionMessageAction';
import { usePermalinkAction } from './actions/usePermalinkAction';
import { usePinMessageAction } from './actions/usePinMessageAction';
import { useReadReceiptsDetailsAction } from './actions/useReadReceiptsDetailsAction';
import { useReplyInDMAction } from './actions/useReplyInDMAction';
import { useReportMessageAction } from './actions/useReportMessageAction';
import { useShowMessageReactionsAction } from './actions/useShowMessageReactionsAction';
import { useStarMessageAction } from './actions/useStarMessageAction';
import { useTranslateAction } from './actions/useTranslateAction';
import { useUnFollowMessageAction } from './actions/useUnFollowMessageAction';
import { useUnpinMessageAction } from './actions/useUnpinMessageAction';
import { useUnstarMessageAction } from './actions/useUnstarMessageAction';
import { useViewOriginalTranslationAction } from './actions/useViewOriginalTranslationAction';
import { EmojiPickerContext } from '../../contexts/EmojiPickerContext';

const PERMALINK_CONTEXTS: MessageActionConfig['context'] = [
	'message',
	'message-mobile',
	'threads',
	'federated',
	'videoconf',
	'videoconf-threads',
];

/** The actions of the message toolbar menu: the built-in ones, gated by permissions and settings, then the apps' ones. */
export const useMessageToolbarValue = ({ readReceipts }: Pick<MessageDisplayContextValue, 'readReceipts'>): MessageToolbarContextValue => {
	const quickReactions = useContext(EmojiPickerContext)?.quickReactions;
	const quickReactionNames = useMemo(() => quickReactions?.map(({ emoji }) => emoji) ?? [], [quickReactions]);

	return useMemo(
		() => ({
			useMenuActions: (message: IMessage, { room, subscription, context }: MessageToolbarScope) => {
				const builtIn = [
					useNewDiscussionMessageAction(message, { room, subscription }),
					useUnpinMessageAction(message, { room, subscription }),
					usePinMessageAction(message, { room, subscription }),
					useStarMessageAction(message, { room }),
					useUnstarMessageAction(message, { room }),
					usePermalinkAction(message, { id: 'permalink-star', context: ['starred'], order: 10 }, { room }),
					usePermalinkAction(message, { id: 'permalink-pinned', context: ['pinned'], order: 5 }, { room }),
					usePermalinkAction(message, { id: 'permalink', context: PERMALINK_CONTEXTS, type: 'duplication', order: 5 }, { room }),
					useFollowMessageAction(message, { room, context }),
					useUnFollowMessageAction(message, { room, context }),
					useMarkAsUnreadMessageAction(message, { room, subscription }),
					useTranslateAction(message, { room, subscription }),
					useViewOriginalTranslationAction(message, { room, subscription }),
					useReplyInDMAction(message, { room, subscription }),
					useCopyAction(message, { subscription }),
					useEditMessageAction(message, { room, subscription }),
					useDeleteMessageAction(message, { room, subscription }),
					useReportMessageAction(message, { room, subscription }),
					useShowMessageReactionsAction(message),
					useReadReceiptsDetailsAction(message, readReceipts),
				].filter(isTruthy);

				const apps = useMessageActionAppsActionButtons(message, context).data ?? [];

				return [...builtIn, ...apps];
			},
			useAiActions: (message: IMessage, { context }: MessageToolbarScope) =>
				useMessageActionAppsActionButtons(message, context, 'ai').data ?? [],
			useQuickReactions: () => quickReactionNames,
		}),
		[readReceipts, quickReactionNames],
	);
};
