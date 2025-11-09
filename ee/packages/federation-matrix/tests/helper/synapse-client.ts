/* eslint-disable no-await-in-loop */
/**
 * Federation test data and configuration
 * This file provides validated federation configuration for federation tests.
 */

import { createClient, type MatrixClient, KnownMembership, type Room, type RoomMember } from 'matrix-js-sdk';

/**
 * Creates a promise that resolves after the specified delay.
 *
 * Utility function for adding delays in async operations, particularly
 * useful for retry logic and handling eventual consistency in distributed systems.
 *
 * @param ms - The delay in milliseconds
 * @returns Promise that resolves after the specified delay
 */
export function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Client for interacting with Matrix Synapse homeserver during federation tests.
 *
 * Provides a simplified interface for Matrix operations needed in federation
 * testing scenarios, including room management, member operations, and
 * invitation handling with built-in retry logic for eventual consistency.
 */
export class SynapseClient {
	private matrixClient: MatrixClient | null = null;

	private url: string;

	private username: string;

	private password: string;

	/**
	 * Creates a new SynapseClient instance.
	 *
	 * @param url - The Matrix homeserver URL
	 * @param username - Matrix user ID (e.g., @user:domain.com)
	 * @param password - User password for authentication
	 */
	constructor(url: string, username: string, password: string) {
		this.url = url;
		this.username = username;
		this.password = password;
	}

	/**
	 * Initializes the Matrix client connection.
	 *
	 * Creates and authenticates a Matrix client, then starts the client
	 * to enable real-time operations. Must be called before using other methods.
	 *
	 * @returns Promise that resolves when initialization is complete
	 * @throws Error if authentication fails or client cannot be started
	 */
	async initialize(): Promise<void> {
		const client = await this.createClient(this.username, this.password, this.url);
		await client.startClient();
		this.matrixClient = client;
	}

	/**
	 * Creates and authenticates a Matrix client with silent logging.
	 *
	 * Sets up a Matrix client with minimal logging to reduce noise during
	 * test execution while maintaining full functionality for federation testing.
	 *
	 * @param username - Matrix user ID for authentication
	 * @param password - User password for authentication
	 * @param url - Matrix homeserver URL
	 * @returns Authenticated Matrix client ready for use
	 * @throws Error if login fails or client creation fails
	 */
	private async createClient(username: string, password: string, url: string): Promise<MatrixClient> {
		const silentLogger = {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			trace: () => {},
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			debug: () => {},
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			info: () => {},
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			warn: () => {},
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			error: () => {},
			getChild: () => silentLogger,
		};

		const client = createClient({
			baseUrl: url,
			useAuthorizationHeader: true,
			logger: silentLogger,
		});

		await client.login('m.login.password', {
			user: username,
			password,
		});

		return client;
	}

	/**
	 * Retrieves a room by its display name.
	 *
	 * Searches through all known rooms to find one matching the specified
	 * display name. Useful for federation testing where room names are
	 * used as identifiers.
	 *
	 * @param roomName - The display name of the room to find
	 * @returns The Matrix room object
	 * @throws Error if client is not initialized or room is not found
	 */
	getRoom(roomName: string): Room {
		if (!this.matrixClient) {
			throw new Error('Matrix client is not initialized');
		}
		const rooms = this.matrixClient.getRooms();
		const room = rooms.find((room) => room.name === roomName);

		if (room) {
			return room;
		}

		throw new Error(`No room found with name ${roomName}`);
	}

	/**
	 * Finds a room by name and membership status.
	 *
	 * Searches for a room that matches both the display name and the current
	 * user's membership status. Useful for finding rooms in specific states
	 * like 'invite' or 'join' during federation testing.
	 *
	 * @param roomName - The display name of the room to find
	 * @param membership - The required membership status (e.g., 'invite', 'join')
	 * @returns The Matrix room ID
	 * @throws Error if client is not initialized or room is not found
	 */
	getRoomIdByRoomNameAndMembership(roomName: string, membership: KnownMembership): string {
		if (!this.matrixClient) {
			throw new Error('Matrix client is not initialized');
		}
		const rooms = this.matrixClient.getRooms();
		const room = rooms.find((room) => room.name === roomName && room.getMyMembership() === membership);

		if (room) {
			return room.roomId;
		}

		throw new Error(`No room found with name ${roomName} and membership ${membership}`);
	}

	/**
	 * Accepts a room invitation with configurable retry logic.
	 *
	 * Handles the process of accepting a room invitation, which is common
	 * in federation scenarios where users are invited to remote rooms.
	 * Includes retry logic to handle eventual consistency in distributed systems.
	 *
	 * @param roomName - The display name of the room to join
	 * @param maxRetries - Maximum number of retry attempts (default: 5)
	 * @param retryDelay - Delay between retries in milliseconds (default: 1000)
	 * @param initialDelay - Initial delay before first attempt in milliseconds (default: 5000)
	 * @returns The room ID of the successfully joined room
	 * @throws Error if client is not initialized or all retry attempts fail
	 */
	async acceptInvitationForRoomName(roomName: string, maxRetries = 5, retryDelay = 1000, initialDelay = 5000): Promise<string> {
		if (!this.matrixClient) {
			throw new Error('Matrix client is not initialized');
		}
		if (initialDelay) {
			await wait(initialDelay);
		}
		const retries = Math.max(1, maxRetries);
		let lastError: Error | null = null;
		for (let attempt = 1; attempt <= retries; attempt++) {
			try {
				const roomId = this.getRoomIdByRoomNameAndMembership(roomName, KnownMembership.Invite);
				await this.matrixClient.joinRoom(roomId);
				return roomId;
			} catch (error) {
				if (attempt < retries) {
					await wait(retryDelay);
				}
				lastError = error as Error;
			}
		}

		throw new Error(
			`Failed to accept invitation for room ${roomName} after ${retries} attempts${lastError ? `: ${lastError.message}` : ''}`,
		);
	}

	/**
	 * Retrieves all members of a room.
	 *
	 * Gets the complete list of room members, which is essential
	 * for verifying federation state and member synchronization.
	 *
	 * @param roomName - The display name of the room
	 * @returns Array of room member objects
	 * @throws Error if client is not initialized or room is not found
	 */
	async getRoomMembers(roomName: string): Promise<RoomMember[]> {
		const room = this.getRoom(roomName);

		return room.getMembers();
	}

	/**
	 * Finds a specific room member with retry logic.
	 *
	 * Searches for a member in a room by username or user ID, with configurable
	 * retry logic to handle eventual consistency in federated systems.
	 * This is crucial for federation testing where member synchronization
	 * may take time to propagate across homeservers.
	 *
	 * @param roomName - The display name of the room to search
	 * @param username - The username or user ID to find
	 * @param options - Retry configuration options
	 * @param options.maxRetries - Maximum number of retry attempts (default: 3)
	 * @param options.delay - Delay between retries in milliseconds (default: 1000)
	 * @param options.initialDelay - Initial delay before first attempt in milliseconds (default: 0)
	 * @returns The room member if found, null otherwise
	 */
	async findRoomMember(
		roomName: string,
		username: string,
		options: { maxRetries?: number; delay?: number; initialDelay?: number } = {},
	): Promise<RoomMember | null> {
		const { maxRetries = 3, delay = 1000, initialDelay = 0 } = options;

		if (initialDelay > 0) {
			await wait(initialDelay);
		}

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const members = await this.getRoomMembers(roomName);
				const member = members.find((member: RoomMember) => member.name === username || member.userId === username);

				if (member) {
					return member;
				}

				if (attempt < maxRetries) {
					await wait(delay);
				}
			} catch (error) {
				console.warn(`Attempt ${attempt} to find room member failed:`, error);

				if (attempt < maxRetries) {
					await wait(delay);
				}
			}
		}

		return null;
	}

	/**
	 * Sends a text message to a room.
	 *
	 * Sends a plain text message to the specified room using the Matrix JS SDK.
	 * The room is identified by its display name, which is common in federation
	 * testing scenarios.
	 *
	 * @param roomName - The display name of the room to send the message to
	 * @param message - The text message content to send
	 * @returns Promise resolving to the Matrix event ID of the sent message
	 * @throws Error if client is not initialized or room is not found
	 */
	async sendTextMessage(roomName: string, message: string): Promise<string> {
		if (!this.matrixClient) {
			throw new Error('Matrix client is not initialized');
		}
		const room = this.getRoom(roomName);
		const response = await this.matrixClient.sendTextMessage(room.roomId, message);
		return response.event_id;
	}

	/**
	 * Sends an HTML-formatted message to a room.
	 *
	 * Sends a message with HTML formatting to the specified room using the Matrix JS SDK.
	 * This allows sending formatted text (bold, italic, underline) that will be properly
	 * rendered in Element and other Matrix clients that support HTML formatting.
	 *
	 * @param roomName - The display name of the room to send the message to
	 * @param body - The plain text version of the message (required by Matrix spec)
	 * @param formattedBody - The HTML-formatted version of the message
	 * @returns Promise resolving to the Matrix event ID of the sent message
	 * @throws Error if client is not initialized or room is not found
	 */
	async sendHtmlMessage(roomName: string, body: string, formattedBody: string): Promise<string> {
		if (!this.matrixClient) {
			throw new Error('Matrix client is not initialized');
		}
		const room = this.getRoom(roomName);
		const content: any = {
			msgtype: 'm.text',
			body,
			format: 'org.matrix.custom.html',
			formatted_body: formattedBody,
		};
		const response = await this.matrixClient.sendMessage(room.roomId, content);
		return response.event_id;
	}

	/**
	 * Retrieves all text messages from a room's timeline.
	 *
	 * Gets all text message events from the room's timeline, which is essential
	 * for verifying message synchronization in federation testing. Filters out
	 * non-message events and returns only text messages.
	 *
	 * @param roomName - The display name of the room
	 * @returns Array of text message events from the room's timeline
	 * @throws Error if client is not initialized or room is not found
	 */
	getRoomMessages(roomName: string): Array<{ content: { body: string }; event_id: string; sender: string }> {
		if (!this.matrixClient) {
			throw new Error('Matrix client is not initialized');
		}
		const room = this.getRoom(roomName);
		const { timeline } = room;
		const messages: Array<{ content: { body: string }; event_id: string; sender: string }> = [];

		for (const event of timeline) {
			if (event.getType() === 'm.room.message') {
				const content = event.getContent();
				if (content.msgtype === 'm.text' || content.msgtype === 'm.notice') {
					messages.push({
						content: {
							body: content.body || '',
						},
						event_id: event.getId() || '',
						sender: event.getSender() || '',
					});
				}
			}
		}

		return messages;
	}

	/**
	 * Finds a message in a room's timeline by content.
	 *
	 * Searches for a message in the room's timeline that matches the specified
	 * content text. Useful for verifying that messages appear correctly on
	 * the remote side in federation tests.
	 *
	 * @param roomName - The display name of the room to search
	 * @param messageText - The message text to find
	 * @param options - Retry configuration options
	 * @param options.maxRetries - Maximum number of retry attempts (default: 5)
	 * @param options.delay - Delay between retries in milliseconds (default: 1000)
	 * @param options.initialDelay - Initial delay before first attempt in milliseconds (default: 2000)
	 * @returns The message event if found, null otherwise
	 */
	async findMessageInRoom(
		roomName: string,
		messageText: string,
		options: { maxRetries?: number; delay?: number; initialDelay?: number } = {},
	): Promise<{ content: { body: string }; event_id: string; sender: string } | null> {
		const { maxRetries = 5, delay = 1000, initialDelay = 2000 } = options;

		if (initialDelay > 0) {
			await wait(initialDelay);
		}

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const messages = this.getRoomMessages(roomName);
				const message = messages.find((msg) => msg.content.body === messageText);

				if (message) {
					return message;
				}

				if (attempt < maxRetries) {
					await wait(delay);
				}
			} catch (error) {
				console.warn(`Attempt ${attempt} to find message in room failed:`, error);

				if (attempt < maxRetries) {
					await wait(delay);
				}
			}
		}

		return null;
	}

	/**
	 * Closes the Matrix client connection and cleans up resources.
	 *
	 * Properly shuts down the Matrix client, clears all data stores,
	 * removes event listeners, and logs out. Essential for preventing
	 * resource leaks during test execution.
	 *
	 * @returns Promise that resolves when cleanup is complete
	 */
	async close(): Promise<void> {
		if (this.matrixClient) {
			this.matrixClient.stopClient();
			await this.matrixClient.store?.deleteAllData?.();
			await this.matrixClient.clearStores?.();
			this.matrixClient.removeAllListeners();
			await this.matrixClient.logout(true);
			this.matrixClient = null;
		}
	}
}
