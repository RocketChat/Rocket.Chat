import type { Cloud } from '@rocket.chat/core-typings';
import type { DeleteResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ICloudAnnouncementsModel extends IBaseModel<Cloud.Announcement> {
	removeByViewId(viewId: string): Promise<DeleteResult>;
}
