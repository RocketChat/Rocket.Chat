import type { Page } from '@playwright/test';

export type RoomType = 'c' | 'p' | 'd';

/**
 * Resolves room ID from room name using the Meteor method getRoomByTypeAndName.
 * This is necessary for E2E encrypted rooms as it uses the room coordinator system
 * which has specialized logic that the REST API endpoints don't have.
 */
export async function resolveRoomId(page: Page, type: RoomType, name: string): Promise<string | null> {
	return page.evaluate(
		async ({ roomType, roomName }: { roomType: RoomType; roomName: string }) => {
			// Type-safe access to Meteor
			const windowWithMeteor = window as unknown as { Meteor?: { call?: (method: string, ...args: unknown[]) => void } };
			const meteor = windowWithMeteor.Meteor;

			if (!meteor?.call || typeof meteor.call !== 'function') {
				return null;
			}

			const meteorCall = meteor.call;

			// Promisify the Meteor method call
			return new Promise<string | null>((resolve) => {
				meteorCall('getRoomByTypeAndName', roomType, roomName, (error: unknown, room: { _id?: string } | null) => {
					if (error || !room?._id) {
						resolve(null);
						return;
					}
					resolve(room._id);
				});
			});
		},
		{ roomType: type, roomName: name },
	);
}

/**
 * Resolves private room (group) ID by name - for E2E encrypted channels
 */
export function resolvePrivateRoomId(page: Page, name: string): Promise<string | null> {
	return resolveRoomId(page, 'p', name);
}

/**
 * Resolves channel ID by name
 */
export function resolveChannelRoomId(page: Page, name: string): Promise<string | null> {
	return resolveRoomId(page, 'c', name);
}
