import type { IFreeSwitchEvent, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IFreeSwitchEventModel, InsertionModel } from '@rocket.chat/model-typings';
import type { IndexDescription, Collection, Db, FindOptions, FindCursor, WithoutId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class FreeSwitchEventRaw extends BaseRaw<IFreeSwitchEvent> implements IFreeSwitchEventModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IFreeSwitchEvent>>) {
		super(db, 'freeswitch_events', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { channelUniqueId: 1, sequence: 1 }, unique: false },
			// Allow 15 days of events to be saved
			{ key: { updatedAt: 1 }, expireAfterSeconds: 30 * 24 * 60 * 15 },
		];
	}

	public async registerEvent(event: WithoutId<InsertionModel<IFreeSwitchEvent>>): Promise<void> {
		const { channelUniqueId, sequence } = event;

		if (channelUniqueId && sequence && (await this.exists({ channelUniqueId, sequence }))) {
			return;
		}

		await this.insertOne(event);
	}

	public findAllByCallUUID<T extends IFreeSwitchEvent>(callUUID: string, options?: FindOptions<IFreeSwitchEvent>): FindCursor<T> {
		return this.find<T>({ 'call.UUID': callUUID }, options);
	}

	public findAllByChannelUniqueIds<T extends IFreeSwitchEvent>(
		uniqueIds: string[],
		options?: FindOptions<IFreeSwitchEvent>,
	): FindCursor<T> {
		return this.find<T>(
			{
				channelUniqueId: { $in: uniqueIds },
			},
			options,
		);
	}
}
