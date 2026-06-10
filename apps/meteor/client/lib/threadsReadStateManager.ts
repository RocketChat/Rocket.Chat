import type { IMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

export class ThreadsReadStateManager extends Emitter<{ change: void } & Record<`change:${string}`, void>> {
	private lastReadByThread = new Map<IMessage['_id'], Date>();

	getLastRead(tmid: IMessage['_id']): Date | undefined {
		return this.lastReadByThread.get(tmid);
	}

	setLastRead(tmid: IMessage['_id'], ls: Date): void {
		const current = this.lastReadByThread.get(tmid);
		if (current && current.getTime() >= ls.getTime()) {
			return;
		}

		this.lastReadByThread.set(tmid, ls);
		this.emit(`change:${tmid}`);
	}

	onLastReadChange = (tmid: IMessage['_id'], callback: () => void): (() => void) => {
		return this.on(`change:${tmid}`, callback);
	};
}

export const threadsReadStateManager = new ThreadsReadStateManager();
