import * as path from 'path';

import type { AppManager } from '../AppManager';
import { ProxiedApp } from '../ProxiedApp';
import type { IAppStorageItem } from '../storage';
import type { IParseAppPackageResult } from './IParseAppPackageResult';

export class AppCompiler {
    public normalizeStorageFiles(files: { [key: string]: string }): { [key: string]: string } {
        const result: { [key: string]: string } = {};

        Object.entries(files).forEach(([name, content]) => {
            result[name.replace(/\$/g, '.')] = content;
        });

        return result;
    }

    public async toSandBox(manager: AppManager, storage: IAppStorageItem, packageResult: IParseAppPackageResult): Promise<ProxiedApp> {
        if (typeof packageResult.files[path.normalize(storage.info.classFile)] === 'undefined') {
            throw new Error(`Invalid App package for "${storage.info.name}". Could not find the classFile (${storage.info.classFile}) file.`);
        }

        const runtime = await manager.getRuntime().startRuntimeForApp(packageResult, storage);

        const app = new ProxiedApp(manager, storage, runtime);

        return app;
    }
}
