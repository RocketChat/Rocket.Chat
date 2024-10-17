import type { AppInstallationSource } from './storage';

export interface IGetAppsFilter {
    ids?: Array<string>;
    name?: string | RegExp;
    enabled?: boolean;
    disabled?: boolean;
    installationSource?: AppInstallationSource;
}
