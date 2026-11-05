import type { IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { Message, MessageLeftContainer, MessageContainer } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import { useUserId } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';

import IgnoredContent from '../IgnoredContent';
import MessageAuthorAvatar from '../MessageAuthorAvatar';
import MessageContentFallback from '../MessageContentFallback';
import MessageHeader from '../MessageHeader';
import StatusIndicators from '../StatusIndicators';
import { useMessageDisplay } from '../contexts/MessageDisplayContext';
import { useIsMessageEmphasized } from '../hooks/useIsMessageEmphasized';
import ThreadMessageContent from './thread/ThreadMessageContent';

export type ThreadMessageProps = {
	message: IThreadMessage | IThreadMainMessage;
	unread: boolean;
	sequential: boolean;
	ignoredUser?: boolean;
};

const ThreadMessage = ({ message, sequential, unread, ignoredUser }: ThreadMessageProps) => {
	const { t } = useTranslation();
	const uid = useUserId();
	const { showAvatars } = useMessageDisplay();
	const isEmphasized = useIsMessageEmphasized(message._id);
	const [displayIgnoredMessage, toggleDisplayIgnoredMessage] = useToggle(false);
	const ignored = ignoredUser && !displayIgnoredMessage;

	return (
		<Message
			role='listitem'
			aria-roledescription={t('thread_message')}
			tabIndex={0}
			id={message._id}
			isEditing={isEmphasized}
			isPending={message.temp}
			sequential={sequential}
			data-id={message._id}
			data-mid={message._id}
			data-unread={unread}
			data-sequential={sequential}
			data-own={message.u._id === uid}
		>
			<MessageLeftContainer>
				{!sequential && message.u.username && showAvatars && <MessageAuthorAvatar message={message} />}
				{sequential && <StatusIndicators message={message} />}
			</MessageLeftContainer>

			<MessageContainer>
				{!sequential && <MessageHeader message={message} />}

				{ignored ? (
					<IgnoredContent messageId={message._id} onShowMessageIgnored={toggleDisplayIgnoredMessage} />
				) : (
					<ErrorBoundary fallback={<MessageContentFallback />} resetKeys={[message]}>
						<ThreadMessageContent message={message} />
					</ErrorBoundary>
				)}
			</MessageContainer>
		</Message>
	);
};

export default memo(ThreadMessage);
