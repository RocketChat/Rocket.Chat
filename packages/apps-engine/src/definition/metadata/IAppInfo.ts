import type { IPermission } from '../permissions/IPermission';
import type { AppInterface } from './AppInterface';
import type { IAppAuthorInfo } from './IAppAuthorInfo';

export interface IAppInfo {
    id: string;
    name: string;
    nameSlug: string;
    version: string;
    description: string;
    requiredApiVersion: string;
    author: IAppAuthorInfo;
    classFile: string;
    iconFile: string;
    implements: Array<AppInterface>;
    /** Base64 string of the App's icon. */
    iconFileContent?: string;
    essentials?: Array<AppInterface>;
    permissions?: Array<IPermission>;
    addon?: string;
}
