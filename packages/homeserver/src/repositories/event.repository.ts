import { injectable } from 'tsyringe';
import type { Collection, Filter, FindOptions } from 'mongodb';
import { generateId } from '../authentication';
import type { EventBase, EventStore } from '../models/event.model';
import { DatabaseConnectionService } from '../services/database-connection.service';

@injectable()
export class EventRepository {
	private collection: Collection<EventStore> | null = null;

	constructor(private readonly dbConnection: DatabaseConnectionService) {
		this.getCollection();
	}

	private async getCollection(): Promise<Collection<EventStore>> {
		const db = await this.dbConnection.getDb();
		this.collection = db.collection<EventStore>('events');
		return this.collection;
	}

	async findById(eventId: string): Promise<EventStore | null> {
		const collection = await this.getCollection();
		return collection.findOne({ _id: eventId });
	}

	async findByIds(eventIds: string[]): Promise<EventStore[]> {
		if (!eventIds.length) return [];

		const collection = await this.getCollection();
		return collection.find({ _id: { $in: eventIds } }).toArray();
	}

	async findByRoomId(
		roomId: string,
		limit = 50,
		skip = 0,
	): Promise<EventStore[]> {
		const collection = await this.getCollection();
		return collection
			.find({ 'event.room_id': roomId })
			.sort({ 'event.origin_server_ts': -1 })
			.skip(skip)
			.limit(limit)
			.toArray();
	}

	async findByRoomIdAndEventIds(
		roomId: string,
		eventIds: string[],
	): Promise<EventStore[]> {
		if (!eventIds.length) return [];

		const collection = await this.getCollection();
		return collection
			.find({ 'event.room_id': roomId, _id: { $in: eventIds } })
			.toArray();
	}

	async findLatestInRoom(roomId: string): Promise<EventStore | null> {
		const collection = await this.getCollection();
		return collection.findOne(
			{ 'event.room_id': roomId },
			{ sort: { 'event.depth': -1 } },
		);
	}

	async find(
		query: Filter<EventStore>,
		options: FindOptions,
	): Promise<EventStore[]> {
		const collection = await this.getCollection();
		return collection.find(query, options).toArray();
	}

	async create(
		event: EventBase,
		eventId?: string,
		args?: object,
	): Promise<string> {
		const collection = await this.getCollection();
		const id = eventId || event.event_id || generateId(event);

		await collection.insertOne({
			_id: id,
			event,
			...(args || {}),
		});

		return id;
	}

	async createIfNotExists(event: EventBase): Promise<string> {
		const collection = await this.getCollection();
		const id = event.event_id || generateId(event);

		const existingEvent = await collection.findOne({ _id: id });
		if (existingEvent) return id;

		await collection.insertOne({
			_id: id,
			event,
		});

		return id;
	}

	async findAuthEventsIdsByRoomId(roomId: string): Promise<EventStore[]> {
		const collection = await this.getCollection();
		return collection
			.find({
				'event.room_id': roomId,
				$or: [
					{
						'event.type': {
							$in: [
								'm.room.create',
								'm.room.power_levels',
								'm.room.join_rules',
							],
						},
					},
					{
						'event.type': 'm.room.member',
						'event.content.membership': 'invite',
					},
				],
			})
			.toArray();
	}

	async createStaged(event: EventBase): Promise<string> {
		const collection = await this.getCollection();
		const id = event.event_id || generateId(event);

		await collection.insertOne({
			_id: id,
			event,
			staged: true,
		});

		return id;
	}

	async redactEvent(eventId: string, redactedEvent: EventBase): Promise<void> {
		const collection = await this.getCollection();

		await collection.updateOne(
			{ _id: eventId },
			{ $set: { event: redactedEvent } } // Purposefully replacing the entire event
		);
	}

	async upsert(event: EventBase): Promise<string> {
		const collection = await this.getCollection();
		const id = event.event_id || generateId(event);

		await collection.updateOne(
			{ _id: id },
			{ $set: { _id: id, event } },
			{ upsert: true },
		);

		return id;
	}

	async removeFromStaging(roomId: string, eventId: string): Promise<void> {
		const collection = await this.getCollection();
		await collection.updateOne(
			{ _id: eventId, 'event.room_id': roomId },
			{ $unset: { staged: 1 } },
		);
	}

	async findOldestStaged(roomId: string): Promise<EventStore | null> {
		const collection = await this.getCollection();
		return collection.findOne(
			{ staged: true, 'event.room_id': roomId },
			{ sort: { 'event.origin_server_ts': 1 } },
		);
	}

	public async findPowerLevelsEventByRoomId(
		roomId: string,
	): Promise<EventStore | null> {
		const collection = await this.getCollection();
		return collection.findOne({
			'event.room_id': roomId,
			'event.type': 'm.room.power_levels',
		});
	}

	public async findAllJoinedMembersEventsByRoomId(
		roomId: string,
	): Promise<EventStore[]> {
		const collection = await this.getCollection();
		return collection
			.find({
				'event.room_id': roomId,
				'event.type': 'm.room.member',
				'event.content.membership': 'join',
			})
			.toArray();
	}
}
