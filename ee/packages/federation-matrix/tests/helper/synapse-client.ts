/**
 * Federation test data and configuration
 * This file provides validated federation configuration for federation tests.
 */

import { createClient, MatrixClient, KnownMembership, Room, RoomMember } from 'matrix-js-sdk';
import { federationConfig } from './config';

export function wait(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export class SynapseClient {

	private matrixClient: MatrixClient | null = null;
	private url: string;
	private username: string;
	private password: string;

	constructor(url: string, username: string, password: string) {
		this.url = url;
		this.username = username;
		this.password = password;
	}

	async initialize(): Promise<void> {
		const client = await this.createClient(this.username, this.password, this.url);
		await client.startClient();
		this.matrixClient = client;
	}

	private async createClient(username: string, password: string, url: string): Promise<MatrixClient> {
		const silentLogger = {
			trace: () => {},
			debug: () => {},
			info: () => {},
			warn: () => {},
			error: () => {},
			getChild: () => silentLogger
		};
		
		const client = createClient({
			baseUrl: url,
			useAuthorizationHeader: true,
			logger: silentLogger,
		});
		
		await client.login('m.login.password', {
			user: username,
			password: password,
		});
		
		return client;
	}

	getRoom(roomName: string): Room {
		const room = this.matrixClient?.getRooms()
			.find(room => room.name === roomName);
		
		if (room) {
			return room;
		}

		throw new Error(`No room found with name ${roomName}`);
	}

	getRoomIdByRoomNameAndMembership(roomName: string, membership: KnownMembership): string {
		const room = this.matrixClient?.getRooms()
			.find(room => room.name === roomName && room.getMyMembership() === membership);
		
		if (room) {
			return room.roomId;
		}

		throw new Error(`No room found with name ${roomName} and membership ${membership.toString()}`);
	}

	async acceptInvitationForRoomName(
		roomName: string,
		maxRetries: number = 5,
		retryDelay: number = 1000,
		initialDelay: number = 5000
	): Promise<string> {
		if (initialDelay) {
			await wait(initialDelay);
		}
		let lastError: Error | null = null;
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const roomId = this.getRoomIdByRoomNameAndMembership(roomName, KnownMembership.Invite);
				await this.matrixClient?.joinRoom(roomId);
				return roomId;
			} catch (error) {
				if (attempt < maxRetries) {
					await wait(retryDelay);
				}
				lastError = error as Error;
			}
		}
		
		throw lastError;
	}

	async getRoomMembers(roomName: string): Promise<RoomMember[]> {
		const room = this.getRoom(roomName);

		return room.getMembers();
	}

	async findRoomMember(
		roomName: string, 
		username: string, 
		options: { maxRetries?: number; delay?: number; initialDelay?: number } = {}
	): Promise<RoomMember | null> {
		const { maxRetries = 3, delay = 1000, initialDelay = 0 } = options;
		
		if (initialDelay > 0) {
			await wait(initialDelay);
		}
		
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const members = await this.getRoomMembers(roomName);
				const member = members.find((member: RoomMember) => 
					member.name === username || member.userId === username
				);
				
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

	async createUser(username: string, password: string, displayName?: string): Promise<string> {
		if (!this.matrixClient) {
			throw new Error('Matrix client not initialized');
		}

		const userId = `@${username}:${this.url.replace('https://', '').replace('http://', '')}`;
		
		try {
			// Use the admin API to create a user
			const response = await fetch(`${this.url}/_synapse/admin/v2/users/${encodeURIComponent(userId)}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${this.matrixClient.getAccessToken()}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					password,
					displayname: displayName || username,
					admin: false,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to create user: ${response.status} ${response.statusText} - ${errorText}`);
			}

			return userId;
		} catch (error) {
			throw new Error(`Failed to create user ${username}: ${error}`);
		}
	}

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

