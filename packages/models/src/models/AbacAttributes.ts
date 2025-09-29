import type { RocketChatRecordDeleted, IAbacAttribute } from '@rocket.chat/core-typings';
import type { Collection, Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AbacAttributesRaw extends BaseRaw<IAbacAttribute> {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IAbacAttribute>>) {
		super(db, 'abac_attributes', trash);
	}
}
