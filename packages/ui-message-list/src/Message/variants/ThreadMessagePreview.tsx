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
import { MessageTypes } from '@rocket.chat/message-types';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMessageDisplay } from '../contexts/MessageDisplayContext';
import { useMessageNavigation } from '../contexts/MessageNavigationContext';
import { useMessageRelatedData } from '../contexts/MessageRelatedDataContext';
import { useMessageRenderers } from '../contexts/MessageRenderersContext';
import { useSelectableMessage } from '../hooks/useSelectableMessage';
import { getCheckboxLabel } from '../lib/getCheckboxLabel';
import ThreadMessagePreviewBody from './threadPreview/ThreadMessagePreviewBody';
import ThreadMessagePreviewOrigin from './threadPreview/ThreadMessagePreviewOrigin';

export type ThreadMessagePreviewProps = {
	message: IThreadMessage;
	sequential: boolean;
} & ComponentProps<typeof ThreadMessage>;

/** A thread reply as it shows in the room: a link to the thread, under what the thread started with. */
const ThreadMessagePreview = ({ message, sequential, ...props }: ThreadMessagePreviewProps) => {
	const { t } = useTranslation();
	const { showAvatars, isTranslated } = useMessageDisplay();
	const { Emoji } = useMessageRenderers();
	const { openThread } = useMessageNavigation();
	const parentMessage = useMessageRelatedData().useParentMessage(message.tmid);
	const { isSelecting, isSelected, toggleSelected } = useSelectableMessage(message._id);

	const parent = parentMessage.data;
	const messageType = parent ? MessageTypes.getType(parent) : null;

	const handleThreadClick = () => {
		if (isSelecting) {
			toggleSelected();
			return;
		}

		if (!sequential) {
			if (parent) {
				openThread({ rid: message.rid, tmid: message.tmid, messageId: parent._id });
			}
			return;
		}

		openThread({ rid: message.rid, tmid: message.tmid, messageId: message._id });
	};

	return (
		<ThreadMessage
			role='link'
			aria-roledescription={t('thread_message_preview')}
			tabIndex={0}
			onClick={handleThreadClick}
			onKeyDown={(e) => (e.code === 'Enter' || e.code === 'Space') && handleThreadClick()}
			isSelected={isSelected}
			{...props}
		>
			{!sequential && (
				<ThreadMessageRow>
					<ThreadMessageLeftContainer>
						<ThreadMessageIconThread />
					</ThreadMessageLeftContainer>
					<ThreadMessageContainer>
						<ThreadMessageOrigin system={!!messageType}>
							{parent && !messageType && <ThreadMessagePreviewOrigin parent={parent} reply={message} />}
							{messageType?.text(t, message)}
							{parentMessage.isLoading && <Skeleton />}
						</ThreadMessageOrigin>
						<ThreadMessageUnfollow />
					</ThreadMessageContainer>
				</ThreadMessageRow>
			)}
			<ThreadMessageRow>
				<ThreadMessageLeftContainer>
					{!isSelecting && showAvatars && (
						<MessageAvatar
							emoji={message.emoji ? <Emoji emojiHandle={message.emoji} fillContainer /> : undefined}
							username={message.u.username}
							size='x18'
						/>
					)}
					{isSelecting && <CheckBox checked={isSelected} onChange={toggleSelected} aria-label={getCheckboxLabel(message, t)} />}
				</ThreadMessageLeftContainer>
				<ThreadMessageContainer>
					<ThreadMessageBody>
						{(message as { ignored?: boolean }).ignored ? (
							t('Message_Ignored')
						) : (
							<>
								<ThreadMessagePreviewBody message={message} />
								{isTranslated(message) && (
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
