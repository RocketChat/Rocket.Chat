import type { IThreadMessage } from '@rocket.chat/core-typings';
import {
	Skeleton,
	ThreadMessage,
	ThreadMessageRow,
	MessageLeftContainer,
	ThreadMessageIconThread,
	ThreadMessageContainer,
	ThreadMessageOrigin,
	ThreadMessageBody,
	ThreadMessageFollow,
	ThreadMessageUnfollow,
	CheckBox,
	MessageStatusIndicatorItem,
} from '@rocket.chat/fuselage';
import { MessageTypes } from '@rocket.chat/message-types';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import { useUserId } from '@rocket.chat/ui-contexts';
import type { ComponentProps, KeyboardEvent } from 'react';
import { memo, useId } from 'react';
import { useTranslation } from 'react-i18next';

import { Messages } from '../../../stores';
import {
	useIsSelecting,
	useToggleSelect,
	useIsSelectedMessage,
	useCountSelected,
} from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import { useMessageBody } from '../../../views/room/MessageList/hooks/useMessageBody';
import { useParentMessage } from '../../../views/room/MessageList/hooks/useParentMessage';
import { isParsedMessage } from '../../../views/room/MessageList/lib/isParsedMessage';
import { useGoToThread } from '../../../views/room/hooks/useGoToThread';
import Emoji from '../../Emoji';
import { getCheckboxLabel } from '../helpers/getCheckboxLabel';
import { useShowTranslated } from '../list/MessageListContext';
import ThreadMessagePreviewBody from './threadPreview/ThreadMessagePreviewBody';

export type ThreadMessagePreviewProps = {
	message: IThreadMessage;
	showUserAvatar: boolean;
	sequential: boolean;
} & ComponentProps<typeof ThreadMessage>;

const ThreadMessagePreview = ({ message, showUserAvatar, sequential, ...props }: ThreadMessagePreviewProps) => {
	const parentMessage = useParentMessage(message.tmid);
	const uid = useUserId();
	const threadMainMessage = Messages.useStore((state) => state.get(message.tmid)) ?? parentMessage.data;
	const following = Boolean(uid && threadMainMessage?.replies?.includes(uid));
	const followStateId = useId();

	const translated = useShowTranslated(message);
	const { t } = useTranslation();

	const isSelecting = useIsSelecting();

	const toggleSelected = useToggleSelect(message._id);
	const isSelected = useIsSelectedMessage(message._id);
	useCountSelected();

	const messageType = parentMessage.isSuccess ? MessageTypes.getType(parentMessage.data) : null;
	const messageBody = useMessageBody(parentMessage.data);

	const previewMessage = isParsedMessage(messageBody) ? { md: messageBody } : { msg: messageBody };

	const goToThread = useGoToThread();

	const handleThreadClick = () => {
		if (isSelecting) {
			return toggleSelected();
		}

		return goToThread({ rid: message.rid, tmid: message.tmid, msg: message._id });
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.target !== event.currentTarget || (event.code !== 'Enter' && event.code !== 'Space')) {
			return;
		}

		event.preventDefault();
		handleThreadClick();
	};

	const checkboxLabel = getCheckboxLabel(message, t);

	return (
		<ThreadMessage
			role='link'
			aria-roledescription={t('thread_message_preview')}
			tabIndex={0}
			onClick={handleThreadClick}
			onKeyDown={handleKeyDown}
			aria-describedby={followStateId}
			isSelected={isSelected}
			{...props}
		>
			{!sequential && (
				<ThreadMessageRow>
					<MessageLeftContainer>
						<ThreadMessageIconThread />
					</MessageLeftContainer>
					<ThreadMessageContainer>
						<ThreadMessageOrigin system={!!messageType}>
							{parentMessage.isSuccess && !messageType && (
								<>
									{(parentMessage.data as { ignored?: boolean })?.ignored ? (
										t('Message_Ignored')
									) : (
										<ThreadMessagePreviewBody message={{ ...parentMessage.data, ...previewMessage }} />
									)}
									{translated && (
										<>
											{' '}
											<MessageStatusIndicatorItem name='language' color='info' title={t('Translated')} />
										</>
									)}
								</>
							)}
							{messageType?.text(t, message)}
							{parentMessage.isLoading && <Skeleton />}
						</ThreadMessageOrigin>
						{following ? <ThreadMessageFollow /> : <ThreadMessageUnfollow />}
					</ThreadMessageContainer>
				</ThreadMessageRow>
			)}
			<ThreadMessageRow>
				<MessageLeftContainer>
					{!isSelecting && showUserAvatar && (
						<MessageAvatar
							emoji={message.emoji ? <Emoji emojiHandle={message.emoji} fillContainer /> : undefined}
							username={message.u.username}
							size='x18'
						/>
					)}
					{isSelecting && <CheckBox checked={isSelected} onChange={toggleSelected} aria-label={checkboxLabel} />}
				</MessageLeftContainer>
				<ThreadMessageContainer>
					<ThreadMessageBody>
						{(message as { ignored?: boolean }).ignored ? (
							t('Message_Ignored')
						) : (
							<>
								<ThreadMessagePreviewBody message={message} />
								{translated && (
									<>
										{' '}
										<MessageStatusIndicatorItem name='language' title={t('Translated')} />
									</>
								)}
							</>
						)}
					</ThreadMessageBody>
				</ThreadMessageContainer>
			</ThreadMessageRow>
			<span id={followStateId} hidden>
				{following ? t('Following') : t('Not_following')}
			</span>
		</ThreadMessage>
	);
};

export default memo(ThreadMessagePreview);
