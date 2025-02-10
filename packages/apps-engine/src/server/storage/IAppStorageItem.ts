import type { AppStatus } from '../../definition/AppStatus';
import type { IAppInfo } from '../../definition/metadata';
import type { IPermission } from '../../definition/permissions/IPermission';
import type { ISetting } from '../../definition/settings';
import type { IMarketplaceInfo } from '../marketplace';

export interface IAppStorageItem {
    _id?: string;
    id: string;
    createdAt?: Date;
    updatedAt?: Date;
    status: AppStatus;
    info: IAppInfo;
    installationSource: AppInstallationSource;
    /**
     * The path that represents where the source of the app storaged.
     */
    sourcePath?: string;
    languageContent: { [key: string]: object };
    settings: { [id: string]: ISetting };
    implemented: { [int: string]: boolean };
    marketplaceInfo?: IMarketplaceInfo[];
    permissionsGranted?: Array<IPermission>;
    signature?: string;
    migrated?: boolean;
}

export enum AppInstallationSource {
    MARKETPLACE = 'marketplace',
    PRIVATE = 'private',
}
