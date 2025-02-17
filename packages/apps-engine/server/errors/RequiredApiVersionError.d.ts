import type { IAppInfo } from '../../definition/metadata';
export declare class RequiredApiVersionError implements Error {
    name: string;
    message: string;
    constructor(info: IAppInfo, versionInstalled: string);
}
