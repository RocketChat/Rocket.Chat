import { injectable } from 'tsyringe';
import { Collection } from 'mongodb';
import type { EventBase } from '../models/event.model';
import { DatabaseConnectionService } from '../services/database-connection.service';

type Room = {
	_id: string;
	room: {
		name: string;
		join_rules: string;
		version: string;
		alias?: string;
		canonical_alias?: string;
		deleted?: boolean;
		tombstone_event_id?: string;
	};
};

@injectable()
export class RoomRepository {
	private collection: Collection<Room> | null = null;

	constructor(private readonly dbConnection: DatabaseConnectionService) {
		this.getCollection();
	}

	private async getCollection(): Promise<Collection<Room>> {
		const db = await this.dbConnection.getDb();
		this.collection = db.collection<Room>('rooms');
		return this.collection;
	}

	async upsert(roomId: string, state: EventBase[]) {
		const collection = await this.getCollection();
		await collection.findOneAndUpdate(
			{ _id: roomId },
			{
				$set: {
					_id: roomId,
					state,
				},
			},
			{ upsert: true },
		);
	}

	async insert(
		roomId: string,
		props: { name?: string; canonicalAlias?: string; alias?: string },
	): Promise<void> {
		const collection = await this.getCollection();
		await collection.insertOne({
			_id: roomId,
			room: {
				name: props.name || '',
				join_rules: 'public',
				version: '1',
				alias: props.alias || '',
				canonical_alias: props.canonicalAlias || '',
			},
		});
	}

	async getRoomVersion(roomId: string): Promise<string | null> {
		const collection = await this.getCollection();
		const room = await collection.findOne(
			{ _id: roomId },
			{ projection: { version: 1 } },
		);
		return room?.room.version || null;
	}

	async updateRoomName(roomId: string, name: string): Promise<void> {
		const collection = await this.getCollection();
		await collection.updateOne(
			{ room_id: roomId },
			{ $set: { name: name } },
			{ upsert: false },
		);
	}
	public async findOneById(roomId: string): Promise<Room | null> {
		const collection = await this.getCollection();
		return collection.findOne({ _id: roomId });
	}

	async markRoomAsDeleted(
		roomId: string,
		tombstoneEventId: string,
	): Promise<void> {
		const collection = await this.getCollection();
		await collection.updateOne(
			{ _id: roomId },
			{
				$set: {
					'room.deleted': true,
					'room.tombstone_event_id': tombstoneEventId,
				},
			},
		);
	}
}
