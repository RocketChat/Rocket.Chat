import { Skeleton, ThreadMessage as ThreadMessageTemplate } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { IThreadMessage } from '../../../../../definition/IMessage';
import MessageBodyRender from '../../../../components/Message/MessageBodyRender';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import { useMessageActions } from '../../contexts/MessageContext';
import { useMessageBody } from '../hooks/useMessageBody';
import { useParentMessage } from '../hooks/useParentMessage';

export const ThreadMessage: FC<{ message: IThreadMessage; sequential: boolean }> = ({
	message,
	sequential,
	...props
}) => {
	const {
		actions: { openThread },
	} = useMessageActions();
	const parentMessage = useParentMessage(message.tmid);
	const body = useMessageBody(parentMessage.value);
	return (
		<ThreadMessageTemplate {...props}>
			{!sequential && (
				<ThreadMessageTemplate.Row>
					<ThreadMessageTemplate.LeftContainer>
						<ThreadMessageTemplate.Icon />
					</ThreadMessageTemplate.LeftContainer>
					<ThreadMessageTemplate.Container>
						<ThreadMessageTemplate.Origin>
							{parentMessage.phase === AsyncStatePhase.RESOLVED ? body : <Skeleton />}
						</ThreadMessageTemplate.Origin>
						<ThreadMessageTemplate.Unfollow />
					</ThreadMessageTemplate.Container>
				</ThreadMessageTemplate.Row>
			)}
			<ThreadMessageTemplate.Row onClick={openThread(message.tmid, message._id)}>
				<ThreadMessageTemplate.LeftContainer>
					<UserAvatar username={message.u.username} size='x18' />
				</ThreadMessageTemplate.LeftContainer>
				<ThreadMessageTemplate.Container>
					<ThreadMessageTemplate.Message>
						{message.md ? (
							<MessageBodyRender mentions={message.mentions} tokens={message.md} />
						) : (
							message.msg
						)}
					</ThreadMessageTemplate.Message>
				</ThreadMessageTemplate.Container>
			</ThreadMessageTemplate.Row>
		</ThreadMessageTemplate>
	);
};
