import type { IThreadMessage } from '@rocket.chat/core-typings';
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
import type { ComponentProps, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import ThreadMessagePreviewBody from './ThreadMessagePreviewBody';
import { useIsSelecting, useToggleSelect, useIsSelectedMessage } from '../../../../views/room/MessageList/contexts/SelectedMessagesContext';
import Emoji from '../../../Emoji';
import { getCheckboxLabel } from '../../helpers/getCheckboxLabel';
import { useShowTranslated } from '../../list/MessageListContext';

export type ThreadMessagePreviewFrameProps = {
	message: IThreadMessage;
	showUserAvatar: boolean;
	/** The line naming the message the thread started from; a preview without one continues the group above it */
	origin?: ReactNode;
	/** Opens the thread where this preview points */
	onOpen: () => void;
} & ComponentProps<typeof ThreadMessage>;

/** The parts every thread reply preview shares: the clickable, selectable row with the reply itself, under an optional origin line */
const ThreadMessagePreviewFrame = ({ message, showUserAvatar, origin, onOpen, ...props }: ThreadMessagePreviewFrameProps) => {
	const { t } = useTranslation();
	const translated = useShowTranslated(message);

	const isSelecting = useIsSelecting();
	const toggleSelected = useToggleSelect(message._id);
	const isSelected = useIsSelectedMessage(message._id);

	const handleClick = () => (isSelecting ? toggleSelected() : onOpen());

	return (
		<ThreadMessage
			role='link'
			aria-roledescription={t('thread_message_preview')}
			tabIndex={0}
			onClick={handleClick}
			onKeyDown={(e) => (e.code === 'Enter' || e.code === 'Space') && handleClick()}
			isSelected={isSelected}
			{...props}
		>
			{origin}
			<ThreadMessageRow>
				<ThreadMessageLeftContainer>
					{!isSelecting && showUserAvatar && (
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

export default ThreadMessagePreviewFrame;
