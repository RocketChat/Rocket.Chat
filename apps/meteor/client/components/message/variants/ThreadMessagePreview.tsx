import { isOTRAckMessage, isOTRMessage, type IThreadMessage } from '@rocket.chat/core-typings';
import {
	ThreadMessage,
	ThreadMessageRow,
	ThreadMessageLeftContainer,
	ThreadMessageContainer,
	ThreadMessageBody,
	CheckBox,
	MessageStatusIndicatorItem,
} from '@rocket.chat/fuselage';
import { MessageAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps, ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
	useIsSelecting,
	useToggleSelect,
	useIsSelectedMessage,
	useCountSelected,
} from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import { useGoToThread } from '../../../views/room/hooks/useGoToThread';
import Emoji from '../../Emoji';
import { useShowTranslated } from '../list/MessageListContext';
import ThreadMessagePreviewBody from './threadPreview/ThreadMessagePreviewBody';

type ThreadMessagePreviewProps = {
	message: IThreadMessage;
	showUserAvatar: boolean;
} & ComponentProps<typeof ThreadMessage>;

const ThreadMessagePreview = ({ message, showUserAvatar, ...props }: ThreadMessagePreviewProps): ReactElement => {
	const translated = useShowTranslated(message);
	const { t } = useTranslation();

	const isSelecting = useIsSelecting();
	const isOTRMsg = isOTRMessage(message) || isOTRAckMessage(message);

	const toggleSelected = useToggleSelect(message._id);
	const isSelected = useIsSelectedMessage(message._id, isOTRMsg);
	useCountSelected();

	const goToThread = useGoToThread();

	const handleThreadClick = () => {
		if (!isSelecting) {
			return goToThread({ rid: message.rid, tmid: message.tmid, msg: message._id });
		}

		if (isOTRMsg) {
			return;
		}

		return toggleSelected();
	};

	return (
		<ThreadMessage
			role='link'
			aria-roledescription={isOTRMsg ? t('OTR_thread_message_preview') : t('thread_message_preview')}
			tabIndex={0}
			onClick={handleThreadClick}
			onKeyDown={(e) => e.code === 'Enter' && handleThreadClick()}
			isSelected={isSelected}
			data-qa-selected={isSelected}
			{...props}
		>
			<ThreadMessageRow>
				<ThreadMessageLeftContainer>
					{!isSelecting && showUserAvatar && (
						<MessageAvatar
							emoji={message.emoji ? <Emoji emojiHandle={message.emoji} fillContainer /> : undefined}
							username={message.u.username}
							size='x18'
						/>
					)}
					{isSelecting && <CheckBox disabled={isOTRMsg} checked={isSelected} onChange={toggleSelected} />}
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
