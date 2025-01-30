import type { IRoom } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { useSyncExternalStore } from 'react';

import { getConfig } from './utils/getConfig';
import { RoomHistoryManager } from '../../app/ui-utils/client/lib/RoomHistoryManager';

const debug = !!(getConfig('debug') || getConfig('debug-RoomStore'));

class RoomStore extends Emitter<{
	changed: undefined;
}> {
	lastTime?: Date;

	scroll?: number;

	lm?: Date;

	atBottom = true;

	constructor(readonly rid: string) {
		super();

		debug && this.on('changed', () => console.log(`RoomStore ${this.rid} changed`, this));
	}

	update({ scroll, lastTime, atBottom }: { scroll?: number; lastTime?: Date; atBottom?: boolean }): void {
		if (scroll !== undefined) {
			this.scroll = scroll;
		}
		if (lastTime !== undefined) {
			this.lastTime = lastTime;
		}

		if (atBottom !== undefined) {
			this.atBottom = atBottom;
		}
		if (scroll || lastTime) {
			this.emit('changed');
		}
	}
}

const debugRoomManager = !!(getConfig('debug') || getConfig('debug-RoomManager'));
export const RoomManager = new (class RoomManager extends Emitter<{
	changed: IRoom['_id'] | undefined;
	opened: IRoom['_id'];
	closed: IRoom['_id'];
	back: IRoom['_id'];
	removed: IRoom['_id'];
}> {
	private rid: IRoom['_id'] | undefined;

	public lastRid: IRoom['_id'] | undefined;

	private rooms: Map<IRoom['_id'], RoomStore> = new Map();

	private parentRid?: IRoom['_id'] | undefined;

	constructor() {
		super();
		debugRoomManager &&
			this.on('opened', (rid) => {
				console.log('room opened ->', rid);
			});

		debugRoomManager &&
			this.on('back', (rid) => {
				console.log('room moved to back ->', rid);
			});

		debugRoomManager &&
			this.on('closed', (rid) => {
				console.log('room close ->', rid);
			});
	}

	get lastOpened(): IRoom['_id'] | undefined {
		return this.lastRid;
	}

	get opened(): IRoom['_id'] | undefined {
		return this.parentRid ?? this.rid;
	}

	get openedSecondLevel(): IRoom['_id'] | undefined {
		if (!this.parentRid) {
			return undefined;
		}
		return this.rid;
	}

	visitedRooms(): IRoom['_id'][] {
		return [...this.rooms.keys()];
	}

	back(rid: IRoom['_id']): void {
		if (rid === this.rid) {
			this.lastRid = rid;
			this.rid = undefined;
			this.emit('back', rid);
			this.emit('changed', this.rid);
		}
	}

	getMore(rid: IRoom['_id']): void {
		RoomHistoryManager.getMore(rid);
	}

	close(rid: IRoom['_id']): void {
		if (this.rooms.has(rid)) {
			this.rooms.delete(rid);
			this.emit('closed', rid);
		}
		this.emit('changed', this.rid);
	}

	private _open(rid: IRoom['_id'], parent?: IRoom['_id']): void {
		if (rid === this.rid) {
			return;
		}
		this.back(rid);
		if (!this.rooms.has(rid)) {
			this.rooms.set(rid, new RoomStore(rid));
		}
		this.rid = rid;
		this.parentRid = parent;
		this.emit('opened', this.rid);
		this.emit('changed', this.rid);
	}

	open(rid: IRoom['_id']): void {
		this._open(rid);
	}

	openSecondLevel(parentId: IRoom['_id'], rid: IRoom['_id']): void {
		this._open(rid, parentId);
	}

	getStore(rid: IRoom['_id']): RoomStore | undefined {
		return this.rooms.get(rid);
	}
})();

const subscribeOpenedRoom = [
	(callback: () => void): (() => void) => RoomManager.on('changed', callback),
	(): IRoom['_id'] | undefined => RoomManager.opened,
] as const;

const subscribeOpenedSecondLevelRoom = [
	(callback: () => void): (() => void) => RoomManager.on('changed', callback),
	(): IRoom['_id'] | undefined => RoomManager.openedSecondLevel,
] as const;

export const useOpenedRoom = (): IRoom['_id'] | undefined => useSyncExternalStore(...subscribeOpenedRoom);

export const useSecondLevelOpenedRoom = (): IRoom['_id'] | undefined => useSyncExternalStore(...subscribeOpenedSecondLevelRoom);
