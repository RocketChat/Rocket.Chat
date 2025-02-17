import type { AppManager } from '../AppManager';
import { ProxiedApp } from '../ProxiedApp';
import type { IAppStorageItem } from '../storage';
import type { IParseAppPackageResult } from './IParseAppPackageResult';
export declare class AppCompiler {
    normalizeStorageFiles(files: {
        [key: string]: string;
    }): {
        [key: string]: string;
    };
    toSandBox(manager: AppManager, storage: IAppStorageItem, packageResult: IParseAppPackageResult): Promise<ProxiedApp>;
}
