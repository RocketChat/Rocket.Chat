import { ThreadMessage as ThreadMessageTemplate } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { IMessage } from '../../../../../definition/IMessage';
import MessageBodyRender from '../../../../components/Message/MessageBodyRender';
import UserAvatar from '../../../../components/avatar/UserAvatar';

export const ThreadMessage: FC<{ message: IMessage; sequential: boolean }> = ({
	message,
	sequential,
	...props
}) => (
	<ThreadMessageTemplate {...props}>
		{!sequential && (
			<ThreadMessageTemplate.Row>
				<ThreadMessageTemplate.LeftContainer>
					<ThreadMessageTemplate.Icon />
				</ThreadMessageTemplate.LeftContainer>
				<ThreadMessageTemplate.Container>
					<ThreadMessageTemplate.Origin>
						Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
						commodo consequat a duis aute irure dolor in reprehenderit in voluptate velit esse
						cillum dolore eu fugiat nulla pariatur. Consectetur adipiscing elit, sed do eiusmod
						tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...
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
