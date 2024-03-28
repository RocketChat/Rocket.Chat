import type { IUpload } from '@rocket.chat/core-typings';

import type { IAppsUpload } from '../AppsEngine';

export interface IAppUploadsConverter {
	convertById(uploadId: string): Promise<IAppsUpload | undefined>;
	convertToApp(upload: undefined | null): Promise<undefined>;
	convertToApp(upload: IUpload): Promise<IAppsUpload>;
	convertToApp(upload: IUpload | undefined | null): Promise<IAppsUpload | undefined>;
	convertToRocketChat(upload: undefined | null): undefined;
	convertToRocketChat(upload: IAppsUpload): IUpload;
	convertToRocketChat(upload: IAppsUpload | undefined | null): IUpload | undefined;
}
