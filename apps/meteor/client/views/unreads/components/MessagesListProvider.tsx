import React, { memo, useMemo } from 'react';

import { MessageListContext, MessageListContextValue } from '../../room/MessageList/contexts/MessageListContext';

export const MessageListProvider = memo(function MessageListProvider({ ...props }) {
	const context: MessageListContextValue = useMemo(
		() => ({
			useShowTranslated: () => false,
			useTranslateProvider: () => false,
			useTranslateAttachments: () => [],
			useShowStarred: () => false,
			useShowFollowing: () => false,
			useUserHasReacted: () => (): boolean => false,
			useMessageDateFormatter:
				() =>
				(date: Date): string =>
					date.toLocaleString(),
			useReactToMessage: () => (): void => undefined,
			useOpenEmojiPicker: () => (): void => undefined,
			useReactionsFilter:
				(message) =>
				(reaction: string): string[] =>
					message.reactions ? message.reactions[reaction]?.usernames || [] : [],
			showReadReceipt: false,
			showRoles: false,
			showRealName: false,
			showUsername: false,
			showColors: false,
		}),
		[],
	);

	return <MessageListContext.Provider value={context} {...props} />;
});
