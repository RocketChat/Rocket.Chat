import { DDPSDK } from '@rocket.chat/ddp-client';
import { Box, Button } from '@rocket.chat/fuselage';
import React, { useState } from 'react';

import Login from './Login';
import Page from './Page';
import Room from './Room';
import RoomList from './RoomList';

// TODO Add entry to docs about emitter being a peer dependency

// This is a simple implementation of a hashing function using the SubtleCrypto API
// We advise you do your own research on how to hash passwords securely
async function hashPassword(password: string): Promise<string> {
	// Step 1: Convert the input string to a Uint8Array
	const encoder = new TextEncoder();
	const data = encoder.encode(password);

	// Step 2: Use the SubtleCrypto API to create a hash
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);

	// Step 3: Convert the hash buffer to a hex string
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');

	// Step 4: Return the hashed string
	return hashHex;
}

// First step is to create a new SDK instance with the URL of the target server
const SERVER_URL = 'http://localhost:3000';
const sdk = DDPSDK.create(SERVER_URL);

// We can then use the SDK to login to the server
const login = async (username: string, password: string, sdk: DDPSDK) => {
	try {
		await sdk.connection.connect();
		// The loginWithPassword method from the account module expects the password to be hashed with SHA-256
		// If login is successful, you can access the credentials by referencing `sdk.account.user`
		await sdk.account.loginWithPassword(username, await hashPassword(password));

		// If you have the user's token, you can use the loginWithToken method instead
		// Tip: If you're integrating Rocket.Chat you can generate user tokens using the REST API
		// v1/users.createToken
		// You can also use this method to resume login if you saved the token somewhere else (e.g localStorage)
		// await sdk.account.loginWithToken(token);
	} catch (error) {
		console.error(error);
	}
};

export default function App() {
	const [loggedIn, setLoggedIn] = useState(false);
	const [roomId, setRoomId] = useState('GENERAL');

	if (!loggedIn) {
		return (
			<Login
				onLogin={async (username, password): Promise<void> => {
					await login(username, password, sdk);
					setLoggedIn(true);
				}}
			/>
		);
	}

	// We can check the status of the connection to make sure the websocket is connected to the server
	if (sdk.connection.status !== 'connected') {
		return (
			<Page flexDirection='column'>
				<Box is='h1' alignSelf='center' pbs={64} pbe={8}>
					SDK not Connected
				</Box>
				<Box alignSelf='center'>
					<Button
						primary
						onClick={() => {
							setLoggedIn(false);
						}}
					>
						Retry connection
					</Button>
				</Box>
			</Page>
		);
	}

	return (
		<Page>
			<RoomList setRoomId={setRoomId} sdk={sdk} roomId={roomId} />
			<Room sdk={sdk} id={roomId} />
		</Page>
	);
}
