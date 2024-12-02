import type { AppImplements } from './AppImplements';
import type { IAppInfo } from '../../definition/metadata';

export interface IParseAppPackageResult {
    info: IAppInfo;
    files: { [key: string]: string };
    languageContent: { [key: string]: object };
    implemented: AppImplements;
}
