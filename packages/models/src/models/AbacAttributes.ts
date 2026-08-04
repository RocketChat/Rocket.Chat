import type { IAbacAttribute } from '@rocket.chat/core-typings';
import type { Db, FindOptions, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AbacAttributesRaw extends BaseRaw<IAbacAttribute> {
	constructor(db: Db) {
		super(db, 'abac_attributes');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { key: 1 }, unique: true }, { key: { values: 1 } }];
	}

	findOneByKey(key: string, options: FindOptions<IAbacAttribute> = {}): Promise<IAbacAttribute | null> {
		return this.findOne({ key }, options);
	}

	async countTotalValues(): Promise<number> {
		const [result] = await this.col
			.aggregate<{ totalValues: number }>([
				{
					$group: {
						_id: null,
						totalValues: {
							$sum: {
								$size: {
									$ifNull: ['$values', []],
								},
							},
						},
					},
				},
			])
			.toArray();

		return result?.totalValues ?? 0;
	}
}
