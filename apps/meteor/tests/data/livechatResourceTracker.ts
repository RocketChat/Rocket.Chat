import type { ILivechatVisitor, IOmnichannelRoom } from '@rocket.chat/core-typings';

import { closeOmnichannelRoom, deleteVisitor } from './livechat/rooms';

/**
 * Lightweight tracker for Livechat resources (visitors and rooms) created
 * during a test suite. Call {@link cleanup} in an `after()` hook to close
 * all rooms and delete all visitors that were registered.
 *
 * @example
 * describe('my suite', () => {
 *   const tracker = new LivechatResourceTracker();
 *
 *   after(() => tracker.cleanup());
 *
 *   it('creates a visitor and room', async () => {
 *     const visitor = await createVisitor();
 *     const room = await createLivechatRoom(visitor.token);
 *     tracker.add(visitor, room);
 *   });
 * });
 */
export class LivechatResourceTracker {
	private visitors: string[] = [];

	private rooms: string[] = [];

	/**
	 * Track a visitor and, optionally, its room for later cleanup.
	 */
	add(visitor: ILivechatVisitor, room?: IOmnichannelRoom): void {
		this.visitors.push(visitor.token);
		if (room) {
			this.rooms.push(room._id);
		}
	}

	/**
	 * Track only a room for later cleanup.
	 */
	addRoom(room: IOmnichannelRoom): void {
		this.rooms.push(room._id);
	}

	/**
	 * Close all tracked rooms, then delete all tracked visitors.
	 * Silently ignores errors so that cleanup does not mask test failures.
	 */
	async cleanup(): Promise<void> {
		await Promise.allSettled(this.rooms.map((rid) => closeOmnichannelRoom(rid)));
		await Promise.allSettled(this.visitors.map((token) => deleteVisitor(token)));
		this.rooms = [];
		this.visitors = [];
	}
}
