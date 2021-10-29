import { Skeleton, ThreadMessage as ThreadMessageTemplate } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { IThreadMessage } from '../../../../../definition/IMessage';
import MessageBodyRender from '../../../../components/Message/MessageBodyRender';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useParentMessage } from '../hooks/useParentMessage';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import { useMessageBody } from '../hooks/useMessageBody';

export const ThreadMessage: FC<{ message: IThreadMessage; sequential: boolean }> = ({
	message,
	sequential,
	...props
}) => {
	const parentMessage = useParentMessage(message.tmid);
	const body = useMessageBody(parentMessage.value);
	return <ThreadMessageTemplate {...props}>
		{!sequential && (
			<ThreadMessageTemplate.Row>
				<ThreadMessageTemplate.LeftContainer>
					<ThreadMessageTemplate.Icon />
				</ThreadMessageTemplate.LeftContainer>
				<ThreadMessageTemplate.Container>
					<ThreadMessageTemplate.Origin>
						{parentMessage.phase === AsyncStatePhase.RESOLVED ? body : <Skeleton /> }
					</ThreadMessageTemplate.Origin>
					<ThreadMessageTemplate.Unfollow />
				</ThreadMessageTemplate.Container>
			</ThreadMessageTemplate.Row>
		)}
		<ThreadMessageTemplate.Row>
			<ThreadMessageTemplate.LeftContainer>
				<UserAvatar username={message.u.username} size={'x20'} />
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
