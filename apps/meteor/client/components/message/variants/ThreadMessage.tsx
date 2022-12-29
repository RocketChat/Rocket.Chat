import type { ISubscription, IMessage } from '@rocket.chat/core-typings';
import { Message, MessageLeftContainer, MessageContainer, CheckBox } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import React, { useMemo, memo } from 'react';

import Toolbox from '../../../views/room/MessageList/components/Toolbox';
import { useIsMessageHighlight } from '../../../views/room/MessageList/contexts/MessageHighlightContext';
import { useMessageListContext } from '../../../views/room/MessageList/contexts/MessageListContext';
import {
	useCountSelected,
	useIsSelectedMessage,
	useIsSelecting,
	useToggleSelect,
} from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import type { MessageWithMdEnforced } from '../../../views/room/MessageList/lib/parseMessageTextToAstMarkdown';
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
	message: IMessage;
	sequential: boolean;
	subscription?: ISubscription;
} & Record<`data-${string}`, string>;

const ThreadMessage = ({ message, sequential, subscription, ...props }: ThreadMessageProps): ReactElement => {
	const editing = useIsMessageHighlight(message._id);
	const [ignored, toggleIgnoring] = useToggle((message as { ignored?: boolean }).ignored);
	const {
		actions: { openUserCard },
	} = useMessageActions();

	const selecting = useIsSelecting();
	const toggleSelected = useToggleSelect(message._id);
	const selected = useIsSelectedMessage(message._id);
	useCountSelected();

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
		return (message: IMessage): MessageWithMdEnforced =>
			parseMessageTextToAstMarkdown(removePossibleNullMessageValues(message), parseOptions, autoTranslateLanguage, useShowTranslated);
	}, [autoTranslateLanguage, katex, showColors, useShowTranslated]);

	return (
		<Message
			id={message._id}
			onClick={selecting ? toggleSelected : undefined}
			isSelected={selected}
			isEditing={editing}
			isPending={message.temp}
			sequential={sequential}
			data-qa-editing={editing}
			data-qa-selected={selected}
			{...props}
		>
			<MessageLeftContainer>
				{!sequential && message.u.username && !selecting && (
					<UserAvatar
						url={message.avatar}
						username={message.u.username}
						size={'x36'}
						onClick={openUserCard(message.u.username)}
						style={{ cursor: 'pointer' }}
					/>
				)}
				{selecting && <CheckBox checked={selected} onChange={toggleSelected} />}
				{sequential && <StatusIndicators message={message} />}
			</MessageLeftContainer>

			<MessageContainer>
				{!sequential && <MessageHeader message={message} />}

				{ignored ? (
					<IgnoredContent onShowMessageIgnored={toggleIgnoring} />
				) : (
					<ThreadMessageContent id={message._id} message={normalizeMessage(message)} subscription={subscription} sequential={sequential} />
				)}
			</MessageContainer>
			{!message.private && <Toolbox message={message} />}
		</Message>
	);
};

export default memo(ThreadMessage);
