import type { VideoConference } from '@rocket.chat/core-typings';

import { RecordList } from '../../../../../lib/lists/RecordList';

export class VideoConfRecordList extends RecordList<VideoConference> {
	protected compare(a: VideoConference, b: VideoConference): number {
		return b.createdAt.getTime() - a.createdAt.getTime();
	}
}
