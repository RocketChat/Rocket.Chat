import type { IRocketChatRecord } from '@rocket.chat/core-typings';

import type { RealTimeData } from './DatabaseWatcher';

const actions = {
	i: 'insert',
	u: 'update',
	d: 'remove',
};
export function convertOplogPayload({
	id,
	op,
}: {
	id: string;
	op: { op: 'i' | 'u' | 'd'; o: any };
}): RealTimeData<IRocketChatRecord> | void {
	const action = actions[op.op];
	if (action === 'insert') {
		return {
			action,
			clientAction: 'inserted',
			id: op.o._id,
			data: op.o,
			oplog: true,
		};
	}

	if (action === 'update') {
		if (!op.o.$set && !op.o.$unset) {
			return {
				action,
				clientAction: 'updated',
				id,
				data: op.o,
				oplog: true,
			};
		}

		const diff: any = {};
		if (op.o.$set) {
			for (const key in op.o.$set) {
				if (op.o.$set.hasOwnProperty(key)) {
					diff[key] = op.o.$set[key];
				}
			}
		}
		const unset: any = {};
		if (op.o.$unset) {
			for (const key in op.o.$unset) {
				if (op.o.$unset.hasOwnProperty(key)) {
					diff[key] = undefined;
					unset[key] = 1;
				}
			}
		}

		return {
			action,
			clientAction: 'updated',
			id,
			diff,
			unset,
			oplog: true,
		};
	}

	if (action === 'remove') {
		return {
			action,
			clientAction: 'removed',
			id,
			oplog: true,
		};
	}
}
