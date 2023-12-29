import type { IMessage } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import React from 'react';

type MessageProps = {
	message: IMessage;
};

const Message = ({ message }: MessageProps) => {
	return (
		<Box display='flex' flexDirection='column' is='p' pi={12} pb={4} key={message._id}>
			<Box fontScale='p1' fontWeight={700} is='span'>
				{message.u.name ? `${message.u.name} @${message.u.username}` : message.u.username}:
			</Box>
			<Box is='span' fontScale='p1' color='default'>
				{message.msg}
			</Box>
		</Box>
	);
};

export default Message;
