import type { DDPSDK } from '@rocket.chat/ddp-client';
import { Box, Throbber } from '@rocket.chat/fuselage';
import React, { useCallback, useEffect, useState } from 'react';

import Composer from './Composer';
import Header from './Header';
import MessageList from './MessageList';

export default function Room({ sdk, id }: { sdk: DDPSDK; id: string }) {
	const [roomData, setRoomData] = useState<Record<string, any>>();

	const onSend = useCallback(
		async (msg: string) => {
			try {
				// For using the REST API, you can use the `sdk.rest` property
				// All properties and methods for both the SDK and the REST API have type definitions
				// You can also check https://developer.rocket.chat/reference/api/rest-api for documentation on API endpoints
				// Below is an example of sending a message to a room using the REST API
				await sdk.rest.post('/v1/chat.sendMessage', { message: { rid: id, msg } });
			} catch (error) {
				console.log(error);
				// Right now the API Cliend (sdk.rest) throws the response when an error happens with the request
				// This means that you can access the response body by doing the following:
				console.log(await (error as Response).json?.());
			}
		},
		[sdk, id],
	);

	useEffect(() => {
		const fetchRoomData = async () => {
			const result = await sdk.rest.get('/v1/subscriptions.getOne', { roomId: id });
			result.subscription && setRoomData(result.subscription);
		};
		void fetchRoomData();
	}, [sdk, id]);

	if (!roomData) {
		return (
			<Box flexGrow={1} flexShrink={1} flexDirection='column' display='flex' justifyContent='center'>
				<Box display='flex' flexDirection='column' justifyContent='center' height='full'>
					<Throbber size='x32' />
				</Box>
			</Box>
		);
	}

	return (
		<Box flexGrow={1} flexShrink={1} flexDirection='column' display='flex'>
			<Header># {roomData.fname || roomData.name}</Header>
			<MessageList sdk={sdk} roomId={id} />
			<Composer onSend={onSend} />
		</Box>
	);
}
