import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import type { ICannedResponseModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

// TODO need to define type for CannedResponse object
export class CannedResponseRaw extends BaseRaw<IOmnichannelCannedResponse> implements ICannedResponseModel {
	constructor(db: Db) {
		super(db, 'canned_response');
	}
}
