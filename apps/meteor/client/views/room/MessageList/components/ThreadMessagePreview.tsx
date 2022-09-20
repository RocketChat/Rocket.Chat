import { IThreadMessage } from '@rocket.chat/core-typings';
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
import React, { FC } from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import { useMessageActions } from '../../contexts/MessageContext';
import { useIsSelecting, useToggleSelect, useIsSelectedMessage, useCountSelected } from '../contexts/SelectedMessagesContext';
import { useMessageBody } from '../hooks/useMessageBody';
import { useParentMessage } from '../hooks/useParentMessage';
import ThreadMessagePreviewBody from './ThreadMessagePreviewBody';

export const ThreadMessagePreview: FC<{ message: IThreadMessage; sequential: boolean }> = ({ message, sequential, ...props }) => {
	const {
		actions: { openThread },
	} = useMessageActions();
	const parentMessage = useParentMessage(message.tmid);
	const body = useMessageBody(parentMessage.value);
	const t = useTranslation();

	const isSelecting = useIsSelecting();
	const toggleSelected = useToggleSelect(message._id);
	const isSelected = useIsSelectedMessage(message._id);
	useCountSelected();

	return (
		<ThreadMessageTemplate
			{...props}
			onClick={isSelecting ? toggleSelected : undefined}
			isSelected={isSelected}
			data-qa-selected={isSelected}
		>
			{!sequential && (
				<ThreadMessageRow>
					<ThreadMessageLeftContainer>
						<ThreadMessageIconThread />
					</ThreadMessageLeftContainer>
					<ThreadMessageContainer>
						<ThreadMessageOrigin>
							{parentMessage.phase === AsyncStatePhase.RESOLVED ? (
								<ThreadMessagePreviewBody message={{ ...parentMessage.value, msg: body }} />
							) : (
								<Skeleton />
							)}
						</ThreadMessageOrigin>
						<ThreadMessageUnfollow />
					</ThreadMessageContainer>
				</ThreadMessageRow>
			)}
			<ThreadMessageRow
				onClick={!(message as { ignored?: boolean }).ignored && !isSelecting ? openThread(message.tmid, message._id) : undefined}
			>
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
