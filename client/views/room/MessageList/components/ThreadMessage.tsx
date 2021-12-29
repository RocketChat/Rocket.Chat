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

import { IThreadMessage } from '../../../../../definition/IMessage';
import MessageBodyRender from '../../../../components/Message/MessageBodyRender';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import { useMessageActions } from '../../contexts/MessageContext';
import { useMessageBody } from '../hooks/useMessageBody';
import { useParentMessage } from '../hooks/useParentMessage';

export const ThreadMessage: FC<{ message: IThreadMessage; sequential: boolean }> = ({ message, sequential, ...props }) => {
	const {
		actions: { openThread },
	} = useMessageActions();
	const parentMessage = useParentMessage(message.tmid);
	const body = useMessageBody(parentMessage.value);
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
			<ThreadMessageRow onClick={openThread(message.tmid, message._id)}>
				<ThreadMessageLeftContainer>
					<UserAvatar username={message.u.username} size='x18' />
				</ThreadMessageLeftContainer>
				<ThreadMessageContainer>
					<ThreadMessageBody>
						{message.md ? <MessageBodyRender mentions={message.mentions} tokens={message.md} /> : message.msg}
					</ThreadMessageBody>
				</ThreadMessageContainer>
			</ThreadMessageRow>
		</ThreadMessageTemplate>
	);
};
