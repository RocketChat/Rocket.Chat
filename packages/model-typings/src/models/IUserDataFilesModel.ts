import type { IUserDataFile } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

import type { IBaseUploadsModel } from './IBaseUploadsModel';

export interface IUserDataFilesModel extends IBaseUploadsModel<IUserDataFile> {
	findLastFileByUser(userId: string, options?: FindOptions<IUserDataFile>): Promise<IUserDataFile | null>;
}
