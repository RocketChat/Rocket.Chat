import { ChangeEvent } from 'mongodb';

import { normalize } from './utils';
import { IInquiry } from '../../../../definition/IInquiry';
import { api } from '../../../../server/sdk/api';

export async function watchInquiries(event: ChangeEvent<IInquiry>): Promise<void> {
	switch (event.operationType) {
		case 'insert':
		case 'update':
			const record = event.fullDocument;
			return api.broadcast('livechat-inquiry-queue-observer', { action: normalize[event.operationType], inquiry: record });
		default:
	}
}
