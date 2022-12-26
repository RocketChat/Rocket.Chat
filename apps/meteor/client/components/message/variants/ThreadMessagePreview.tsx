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
} from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { MessageTypes } from '../../../../app/ui-utils/client';
import {
	useIsSelecting,
	useToggleSelect,
	useIsSelectedMessage,
	useCountSelected,
} from '../../../views/room/MessageList/contexts/SelectedMessagesContext';
import { useMessageBody } from '../../../views/room/MessageList/hooks/useMessageBody';
import { useParentMessage } from '../../../views/room/MessageList/hooks/useParentMessage';
import { useMessageActions } from '../../../views/room/contexts/MessageContext';
import UserAvatar from '../../avatar/UserAvatar';
import ThreadMessagePreviewBody from './threadPreview/ThreadMessagePreviewBody';

type ThreadMessagePreviewProps = {
	message: IThreadMessage;
	sequential: boolean;
};

const ThreadMessagePreview = ({ message, sequential, ...props }: ThreadMessagePreviewProps): ReactElement => {
	const {
		actions: { openThread },
	} = useMessageActions();
	const parentMessage = useParentMessage(message.tmid);
	const body = useMessageBody(parentMessage.data);
	const t = useTranslation();

	const isSelecting = useIsSelecting();
	const toggleSelected = useToggleSelect(message._id);
	const isSelected = useIsSelectedMessage(message._id);
	useCountSelected();

	const messageType = parentMessage.isSuccess ? MessageTypes.getType(parentMessage.data) : null;

	return (
		<ThreadMessage {...props} onClick={isSelecting ? toggleSelected : undefined} isSelected={isSelected} data-qa-selected={isSelected}>
			{!sequential && (
				<ThreadMessageRow onClick={!isSelecting && parentMessage.isSuccess ? openThread(message.tmid, parentMessage.data?._id) : undefined}>
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
										<ThreadMessagePreviewBody message={{ ...parentMessage.data, msg: body }} />
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
			<ThreadMessageRow onClick={!isSelecting ? openThread(message.tmid, message._id) : undefined}>
				<ThreadMessageLeftContainer>
					{!isSelecting && <UserAvatar username={message.u.username} size='x18' />}
					{isSelecting && <CheckBox checked={isSelected} onChange={toggleSelected} />}
				</ThreadMessageLeftContainer>
				<ThreadMessageContainer>
					<ThreadMessageBody>
						{(message as { ignored?: boolean }).ignored ? t('Message_Ignored') : <ThreadMessagePreviewBody message={message} />}
					</ThreadMessageBody>
				</ThreadMessageContainer>
			</ThreadMessageRow>
		</ThreadMessage>
	);
};

export default ThreadMessagePreview;
