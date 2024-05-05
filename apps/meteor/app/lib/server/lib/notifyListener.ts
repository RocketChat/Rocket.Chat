import { api, dbWatchersDisabled } from '@rocket.chat/core-services';
import type { IRocketChatRecord, IRoom } from '@rocket.chat/core-typings';
import type { IBaseModel, IRoomsModel } from '@rocket.chat/model-typings';
import { Rooms } from '@rocket.chat/models';
import type { Filter } from 'mongodb';

type ClientAction = 'inserted' | 'updated' | 'removed';

async function getEntityDataById<T extends IRocketChatRecord, M extends IBaseModel<T>>(
	ids: T['_id'] | T['_id'][],
	model: M,
): Promise<T[]> {
	if (Array.isArray(ids)) {
		const query = { _id: { $in: ids } } as unknown as Filter<T>;
		return model.find(query).toArray();
	}
	const item = await model.findOneById<T>(ids);
	return item ? [item] : [];
}

export async function broadcastOnRoomChanges<T extends IRocketChatRecord>(
	ids: T['_id'] | T['_id'][] | ((...args: any[]) => Promise<T | T[]>),
	clientAction: ClientAction = 'updated',
	args?: { [key: string]: any },
): Promise<void> {
	if (dbWatchersDisabled) {
		const items = typeof ids === 'function' ? await ids() : await getEntityDataById<IRoom, IRoomsModel>(ids, Rooms);
		const itemsArray = Array.isArray(items) ? items : [items];
		for (const item of itemsArray) {
			void api.broadcast('watch.rooms', { clientAction, room: { ...item, ...args } });
		}
	}
}
