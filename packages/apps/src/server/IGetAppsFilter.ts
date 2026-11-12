import type { AppInstallationSource } from './storage/index.js';

export interface IGetAppsFilter {
	ids?: Array<string>;
	name?: string | RegExp;
	enabled?: boolean;
	disabled?: boolean;
	installationSource?: AppInstallationSource;
}
