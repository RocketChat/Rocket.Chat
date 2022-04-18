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
} from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import { useMessageActions } from '../../contexts/MessageContext';
import { useMessageBody } from '../hooks/useMessageBody';
import { useParentMessage } from '../hooks/useParentMessage';

export const ThreadMessagePreview: FC<{ message: IThreadMessage; sequential: boolean }> = ({ message, sequential, ...props }) => {
	const {
		actions: { openThread },
	} = useMessageActions();
	const parentMessage = useParentMessage(message.tmid);
	const body = useMessageBody(parentMessage.value);
	const t = useTranslation();

	return (
		<ThreadMessageTemplate {...props}>
			{!sequential && (
				<ThreadMessageRow>
					<ThreadMessageLeftContainer>
						<ThreadMessageIconThread />
					</ThreadMessageLeftContainer>
					<ThreadMessageContainer>
						<ThreadMessageOrigin>{parentMessage.phase === AsyncStatePhase.RESOLVED ? body : <Skeleton />}</ThreadMessageOrigin>
						<ThreadMessageUnfollow />
					</ThreadMessageContainer>
				</ThreadMessageRow>
			)}
			<ThreadMessageRow onClick={!message.ignored ? openThread(message.tmid, message._id) : undefined}>
				<ThreadMessageLeftContainer>
					<UserAvatar username={message.u.username} size='x18' />
				</ThreadMessageLeftContainer>
				<ThreadMessageContainer>
					<ThreadMessageBody>{message.ignored ? t('Message_Ignored') : message.msg}</ThreadMessageBody>
				</ThreadMessageContainer>
			</ThreadMessageRow>
		</ThreadMessageTemplate>
	);
};
