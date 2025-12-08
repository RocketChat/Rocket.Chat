import type { IMessage } from '@rocket.chat/core-typings';
import { DDPSDK } from '@rocket.chat/ddp-client';

import type { IRequestConfig } from '../../../../../apps/meteor/tests/data/users.helper';

/**
 * DDP Listener for catching ephemeral messages in federation tests
 *
 * This helper creates a DDP connection to listen for ephemeral messages
 * that are broadcast to a specific user. It's designed to work with
 * the federation test environment where the test runs separately from
 * the server.
 */
export class DDPListener {
	private sdk: DDPSDK | null = null;

	private ephemeralMessages: IMessage[] = [];

	private timeoutId: NodeJS.Timeout | null = null;

	private serverUrl: string;

	private userId: string;

	private authToken?: string;

	constructor(apiUrl: string, requestConfig: IRequestConfig) {
		// Extract server URL from API URL (convert HTTP/HTTPS to WebSocket)
		this.serverUrl = apiUrl.replace(/^http/, 'ws');

		// Extract user ID and auth token from request config credentials
		this.userId = requestConfig.credentials['X-User-Id'];
		this.authToken = requestConfig.credentials['X-Auth-Token'];
	}

	/**
	 * Connect to the DDP server and subscribe to ephemeral messages
	 */
	async connect(): Promise<void> {
		try {
			// Create DDP SDK instance
			this.sdk = DDPSDK.create(this.serverUrl);

			// Add timeout for connection
			const connectionTimeout = setTimeout(() => {
				throw new Error('DDP connection timeout');
			}, 10000);

			// Connect to the server
			await this.sdk.connection.connect();

			// Wait a bit for the connection to be fully ready
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Authenticate if we have a token
			if (this.authToken) {
				await this.sdk.account.loginWithToken(this.authToken);
			}

			// Subscribe to ephemeral messages using the stream method
			this.sdk.stream('notify-user', `${this.userId}/message`, (...args) => {
				// The args should contain the ephemeral message
				if (args && args.length > 0) {
					const message = args[0] as IMessage;
					this.ephemeralMessages.push(message);
				}
			});

			// Clear timeout on successful connection
			clearTimeout(connectionTimeout);
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Wait for an ephemeral message with a specific content
	 * @param expectedContent - The expected message content (partial match)
	 * @param timeoutMs - Timeout in milliseconds (default: 5000)
	 * @param roomId - Optional room ID to validate the message belongs to the correct room
	 * @returns Promise that resolves with the message or rejects on timeout
	 */
	async waitForEphemeralMessage(expectedContent: string, timeoutMs = 5000, roomId?: string): Promise<IMessage> {
		return new Promise((resolve, reject) => {
			// Check if message already exists
			const existingMessage = this.ephemeralMessages.find((msg) => {
				const contentMatches = msg.msg?.includes(expectedContent);
				const roomMatches = !roomId || msg.rid === roomId;
				return contentMatches && roomMatches;
			});

			if (existingMessage) {
				resolve(existingMessage);
				return;
			}

			let interval: NodeJS.Timeout | null = null;

			this.timeoutId = setTimeout(() => {
				if (interval) {
					clearInterval(interval);
				}
				const roomInfo = roomId ? ` for room ${roomId}` : '';
				reject(new Error(`Timeout waiting for ephemeral message containing: "${expectedContent}"${roomInfo}`));
			}, timeoutMs);

			const checkMessages = () => {
				const message = this.ephemeralMessages.find((msg) => {
					const contentMatches = msg.msg?.includes(expectedContent);
					const roomMatches = !roomId || msg.rid === roomId;
					return contentMatches && roomMatches;
				});

				if (message) {
					if (this.timeoutId) {
						clearTimeout(this.timeoutId);
						this.timeoutId = null;
					}
					if (interval) {
						clearInterval(interval);
					}
					resolve(message);
				}
			};

			interval = setInterval(checkMessages, 100);
		});
	}

	/**
	 * Get all captured ephemeral messages
	 */
	getEphemeralMessages(): IMessage[] {
		return [...this.ephemeralMessages];
	}

	/**
	 * Clear captured messages
	 */
	clearMessages(): void {
		this.ephemeralMessages = [];
	}

	/**
	 * Disconnect from DDP server
	 */
	disconnect(): void {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}

		if (this.sdk) {
			this.sdk.connection.close();
			this.sdk = null;
		}
	}
}

/**
 * Helper function to create and manage a DDP listener for federation tests
 * @param apiUrl - The Rocket.Chat API URL (e.g., 'http://rc1:3000' or 'https://rc1:3000')
 * @param requestConfig - The request configuration containing credentials
 * @returns DDPListener instance
 */
export function createDDPListener(apiUrl: string, requestConfig: IRequestConfig): DDPListener {
	return new DDPListener(apiUrl, requestConfig);
}
