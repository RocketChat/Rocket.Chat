import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata/index.js';

import type { AppImplements } from './AppImplements.js';

export interface IParseAppPackageResult {
	info: IAppInfo;
	files: { [key: string]: string };
	languageContent: { [key: string]: object };
	implemented: AppImplements;
}
