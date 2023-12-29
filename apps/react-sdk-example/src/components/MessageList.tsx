import type { DDPSDK } from '@rocket.chat/ddp-client';
import { Box } from '@rocket.chat/fuselage';
import React, { useEffect, useState } from 'react';

import Message from './Message';
import { useRoomMessages } from '../hooks/useRoomMessages';

export default function MessageList({ roomId }: { roomId: string }) {
	const messages = useRoomMessages(roomId);

	return (
		<Box flexGrow={1}>
			{messages.size === 0 && (
				<Box is='p' pi={12} pb={4}>
					No messages yet
				</Box>
			)}
			{Array.from(messages.values()).map((message) => {
				return <Message message={message} key={message._id} />;
			})}
		</Box>
	);
}
