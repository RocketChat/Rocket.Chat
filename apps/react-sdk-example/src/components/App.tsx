import { Accordion, Box, Button } from '@rocket.chat/fuselage';
import { useConnectionStatus, useLoginWithPassword, useUser } from '@rocket.chat/ui-contexts';
import React, { useDebugValue, useState } from 'react';

import { useSDK } from '../providers/SDKProvider';
import Login from './Login';
import Page from './Page';
import Room from './Room';
import RoomList from './RoomList';
import { createPortal } from 'react-dom';

export default function App() {
	const sdk = useSDK();
	const user = useUser();

	useDebugValue(sdk.account);
	const login = useLoginWithPassword();

	const [roomId, setRoomId] = useState('GENERAL');

	const { status: connectionStatus } = useConnectionStatus();

	if (!user) {
		return (
			<>
				<Login
					onLogin={async (username, password): Promise<void> => {
						await login(username, password);
					}}
				/>
			</>
		);
	}

	// We can check the status of the connection to make sure the websocket is connected to the server
	if (connectionStatus !== 'connected') {
		return (
			<>
				<Box is='h1' alignSelf='center' pbs={64} pbe={8}>
					SDK not Connected
				</Box>
				<Box alignSelf='center'>
					<Button
						primary
						onClick={() => {
							void sdk.connection.reconnect();
						}}
					>
						Retry connection
					</Button>
				</Box>
			</>
		);
	}

	return (
		<>
			<Box h='full'>
				<Box display='flex' flexDirection='row' h='full'>
					<RoomList setRoomId={setRoomId} roomId={roomId} />
					<Room id={roomId} />
				</Box>
			</Box>
		</>
	);
}
