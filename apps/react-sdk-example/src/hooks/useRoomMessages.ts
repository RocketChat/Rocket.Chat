import type { DDPSDK } from '@rocket.chat/ddp-client';
import { Box } from '@rocket.chat/fuselage';
import React, { useEffect, useState } from 'react';
import { useStream } from '@rocket.chat/ui-contexts';

export const useRoomMessages = (rid: string) => {
	const [messages, setMessages] = useState(new Map());

	const roomMessagesStream = useStream('room-messages');

	useEffect(
		() =>
			roomMessagesStream(rid, (args) => {
				setMessages((messages) => {
					messages.set(args._id, args);
					return new Map(messages);
				});
			}),
		[rid, roomMessagesStream],
	);

	return messages;
};
