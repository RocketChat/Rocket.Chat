import type { IThreadMessage } from '@rocket.chat/core-typings';
import {
	Skeleton,
	ThreadMessage,
	ThreadMessageRow,
	ThreadMessageLeftContainer,
	ThreadMessageIconThread,
	ThreadMessageContainer,
	ThreadMessageOrigin,
	ThreadMessageBody,
	ThreadMessageUnfollow,
	CheckBox,
	MessageStatusIndicatorItem,
} from '@rocket.chat/fuselage';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps, ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { MessageTypes } from '../../../../app/ui-utils/client';
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
import { useShowTranslated } from '../list/MessageListContext';
import ThreadMessagePreviewBody from './threadPreview/ThreadMessagePreviewBody';

type ThreadMessagePreviewProps = {
	message: IThreadMessage;
	showUserAvatar: boolean;
	sequential: boolean;
} & ComponentProps<typeof ThreadMessage>;

const ThreadMessagePreview = ({ message, showUserAvatar, sequential, ...props }: ThreadMessagePreviewProps): ReactElement => {
	const parentMessage = useParentMessage(message.tmid);

	const translated = useShowTranslated(message);
	const { t } = useTranslation();

	const isSelecting = useIsSelecting();
	const isOTRMessage = message.t === 'otr' || message.t === 'otr-ack';

	const toggleSelected = useToggleSelect(message._id);
	const isSelected = useIsSelectedMessage(message._id, isOTRMessage);
	useCountSelected();

	const messageType = parentMessage.isSuccess ? MessageTypes.getType(parentMessage.data) : null;
	const messageBody = useMessageBody(parentMessage.data, message.rid);

	const previewMessage = isParsedMessage(messageBody) ? { md: messageBody } : { msg: messageBody };

	const goToThread = useGoToThread();

	const handleThreadClick = () => {
		if (!isSelecting) {
			if (!sequential) {
				return parentMessage.isSuccess && goToThread({ rid: message.rid, tmid: message.tmid, msg: parentMessage.data?._id });
			}

			return goToThread({ rid: message.rid, tmid: message.tmid, msg: message._id });
		}

		if (isOTRMessage) {
			return;
		}

		return toggleSelected();
	};

	return (
		<ThreadMessage
			role='link'
			aria-roledescription='thread message preview'
			tabIndex={0}
			onClick={handleThreadClick}
			onKeyDown={(e) => e.code === 'Enter' && handleThreadClick()}
			isSelected={isSelected}
			data-qa-selected={isSelected}
			{...props}
		>
			{!sequential && (
				<ThreadMessageRow>
					<ThreadMessageLeftContainer>
						<ThreadMessageIconThread />
					</ThreadMessageLeftContainer>
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
							{messageType && t(messageType.message, messageType.data ? messageType.data(message) : {})}
							{parentMessage.isLoading && <Skeleton />}
						</ThreadMessageOrigin>
						<ThreadMessageUnfollow />
					</ThreadMessageContainer>
				</ThreadMessageRow>
			)}
			<ThreadMessageRow>
				<ThreadMessageLeftContainer>
					{!isSelecting && showUserAvatar && (
						<MessageAvatar
							emoji={message.emoji ? <Emoji emojiHandle={message.emoji} fillContainer /> : undefined}
							username={message.u.username}
							size='x18'
						/>
					)}
					{isSelecting && <CheckBox disabled={isOTRMessage} checked={isSelected} onChange={toggleSelected} />}
				</ThreadMessageLeftContainer>
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
		</ThreadMessage>
	);
};

export default memo(ThreadMessagePreview);
