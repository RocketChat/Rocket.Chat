import type { IParseAppPackageResult } from './IParseAppPackageResult';
export declare class AppPackageParser {
    static uuid4Regex: RegExp;
    private allowedIconExts;
    private appsEngineVersion;
    constructor();
    unpackageApp(appPackage: Buffer): Promise<IParseAppPackageResult>;
    private getLanguageContent;
    private getIconFile;
    private getEngineVersion;
}
