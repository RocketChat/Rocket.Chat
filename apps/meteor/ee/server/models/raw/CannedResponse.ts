import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { ICannedResponseModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';
import { getCollectionName } from '@rocket.chat/models';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

// TODO need to define type for CannedResponse object
export class CannedResponseRaw extends BaseRaw<IRocketChatRecord> implements ICannedResponseModel {
	constructor(db: Db) {
		super(db, getCollectionName('canned_response'));
	}
}
