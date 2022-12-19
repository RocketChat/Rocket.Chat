import type { IThreadMessage } from '@rocket.chat/core-typings';
import {
	Skeleton,
	ThreadMessage as ThreadMessageTemplate,
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
import type { FC } from 'react';
import React from 'react';

import { MessageTypes } from '../../../../../app/ui-utils/client';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useMessageActions } from '../../contexts/MessageContext';
import { useIsSelecting, useToggleSelect, useIsSelectedMessage, useCountSelected } from '../contexts/SelectedMessagesContext';
import { useMessageBody } from '../hooks/useMessageBody';
import { useParentMessage } from '../hooks/useParentMessage';
import ThreadMessagePreviewBody from './ThreadMessagePreviewBody';

const ThreadMessagePreview: FC<{ message: IThreadMessage; sequential: boolean }> = ({ message, sequential, ...props }) => {
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
		<ThreadMessageTemplate
			{...props}
			onClick={isSelecting ? toggleSelected : undefined}
			isSelected={isSelected}
			data-qa-selected={isSelected}
		>
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
		</ThreadMessageTemplate>
	);
};

export default ThreadMessagePreview;
