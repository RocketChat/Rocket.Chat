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
import { useToggle } from '@rocket.chat/fuselage-hooks';
import React, { FC } from 'react';

import { IThreadMessage } from '../../../../../definition/IMessage';
import MessageBodyRender from '../../../../components/Message/MessageBodyRender';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import { useMessageActions } from '../../contexts/MessageContext';
import { useMessageBody } from '../hooks/useMessageBody';
import { useParentMessage } from '../hooks/useParentMessage';
import MessageContentIgnored from './MessageContentIgnored';

export const ThreadMessage: FC<{ message: IThreadMessage; sequential: boolean }> = ({ message, sequential, ...props }) => {
	const {
		actions: { openThread },
	} = useMessageActions();
	const parentMessage = useParentMessage(message.tmid);
	const body = useMessageBody(parentMessage.value);
	const [isMessageIgnored, toggleMessageIgnored] = useToggle(message.ignored);

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
			<ThreadMessageRow onClick={!isMessageIgnored ? openThread(message.tmid, message._id) : undefined}>
				<ThreadMessageLeftContainer>
					<UserAvatar username={message.u.username} size='x18' />
				</ThreadMessageLeftContainer>
				<ThreadMessageContainer>
					<ThreadMessageBody>
						{isMessageIgnored && <MessageContentIgnored onShowMessageIgnored={toggleMessageIgnored} />}
						{!isMessageIgnored && (message.md ? <MessageBodyRender mentions={message.mentions} tokens={message.md} /> : message.msg)}
					</ThreadMessageBody>
				</ThreadMessageContainer>
			</ThreadMessageRow>
		</ThreadMessageTemplate>
	);
};
