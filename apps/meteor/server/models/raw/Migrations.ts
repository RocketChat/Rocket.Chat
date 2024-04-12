import type { IControl } from '@rocket.chat/core-typings';
import type { IMigrationsModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MigrationsRaw extends BaseRaw<IControl> implements IMigrationsModel {
	constructor() {
		super('migrations', undefined, {
			collectionNameResolver(name) {
				return name;
			},
		});
	}
}
