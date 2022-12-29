import type { ISubscription, IThreadMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { Message, MessageLeftContainer, MessageContainer } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import React, { useMemo, memo } from 'react';

import Toolbox from '../../../views/room/MessageList/components/Toolbox';
import { useIsMessageHighlight } from '../../../views/room/MessageList/contexts/MessageHighlightContext';
import { useMessageListContext } from '../../../views/room/MessageList/contexts/MessageListContext';
import { isOwnUserMessage } from '../../../views/room/MessageList/lib/isOwnUserMessage';
import {
	parseMessageTextToAstMarkdown,
	removePossibleNullMessageValues,
} from '../../../views/room/MessageList/lib/parseMessageTextToAstMarkdown';
import { useMessageActions } from '../../../views/room/contexts/MessageContext';
import UserAvatar from '../../avatar/UserAvatar';
import IgnoredContent from '../IgnoredContent';
import MessageHeader from '../MessageHeader';
import StatusIndicators from '../StatusIndicators';
import ThreadMessageContent from './thread/ThreadMessageContent';

type ThreadMessageProps = {
	message: IThreadMessage | IThreadMainMessage;
	subscription?: ISubscription;
	unread: boolean;
	sequential: boolean;
};

const ThreadMessage = ({ message, sequential, subscription, unread }: ThreadMessageProps): ReactElement => {
	const editing = useIsMessageHighlight(message._id);
	const [ignored, toggleIgnoring] = useToggle((message as { ignored?: boolean }).ignored);
	const {
		actions: { openUserCard },
	} = useMessageActions();

	const { autoTranslateLanguage, katex, showColors, useShowTranslated } = useMessageListContext();

	const normalizeMessage = useMemo(() => {
		const parseOptions = {
			colors: showColors,
			emoticons: true,
			...(Boolean(katex) && {
				katex: {
					dollarSyntax: katex?.dollarSyntaxEnabled,
					parenthesisSyntax: katex?.parenthesisSyntaxEnabled,
				},
			}),
		};
		return <TMessage extends IThreadMessage | IThreadMainMessage>(message: TMessage) =>
			parseMessageTextToAstMarkdown(removePossibleNullMessageValues(message), parseOptions, autoTranslateLanguage, useShowTranslated);
	}, [autoTranslateLanguage, katex, showColors, useShowTranslated]);

	const normalizedMessage = useMemo(() => normalizeMessage(message), [message, normalizeMessage]);

	return (
		<Message
			id={message._id}
			isEditing={editing}
			isPending={message.temp}
			sequential={sequential}
			data-qa-editing={editing}
			data-id={message._id}
			data-mid={message._id}
			data-unread={unread}
			data-sequential={sequential}
			data-own={isOwnUserMessage(message, subscription)}
			data-qa-type='message'
		>
			<MessageLeftContainer>
				{!sequential && message.u.username && (
					<UserAvatar
						url={message.avatar}
						username={message.u.username}
						size={'x36'}
						style={{ cursor: 'pointer' }}
						onClick={openUserCard(message.u.username)}
					/>
				)}
				{sequential && <StatusIndicators message={message} />}
			</MessageLeftContainer>

			<MessageContainer>
				{!sequential && <MessageHeader message={message} />}

				{ignored ? (
					<IgnoredContent onShowMessageIgnored={toggleIgnoring} />
				) : (
					<ThreadMessageContent message={normalizedMessage} subscription={subscription} />
				)}
			</MessageContainer>
			{!message.private && <Toolbox message={message} />}
		</Message>
	);
};

export default memo(ThreadMessage);
