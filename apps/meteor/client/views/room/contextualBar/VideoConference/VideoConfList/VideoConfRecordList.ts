import type { IGroupVideoConference } from '@rocket.chat/core-typings';

import { RecordList } from '../../../../../lib/lists/RecordList';

export class VideoConfRecordList extends RecordList<IGroupVideoConference> {
	protected compare(a: IGroupVideoConference, b: IGroupVideoConference): number {
		return b.createdAt.getTime() - a.createdAt.getTime();
	}
}
