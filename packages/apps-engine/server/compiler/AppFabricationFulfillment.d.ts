import type { IAppInfo } from '../../definition/metadata';
import type { ProxiedApp } from '../ProxiedApp';
import { AppLicenseValidationResult } from '../marketplace/license';
export declare class AppFabricationFulfillment {
    info: IAppInfo;
    app: ProxiedApp;
    implemented: {
        [int: string]: boolean;
    };
    licenseValidationResult: AppLicenseValidationResult;
    storageError: string;
    appUserError: object;
    constructor();
    setAppInfo(information: IAppInfo): void;
    getAppInfo(): IAppInfo;
    setApp(application: ProxiedApp): void;
    getApp(): ProxiedApp;
    setImplementedInterfaces(interfaces: {
        [int: string]: boolean;
    }): void;
    getImplementedInferfaces(): {
        [int: string]: boolean;
    };
    setStorageError(errorMessage: string): void;
    setAppUserError(error: object): void;
    getStorageError(): string;
    getAppUserError(): object;
    hasStorageError(): boolean;
    hasAppUserError(): boolean;
    getLicenseValidationResult(): AppLicenseValidationResult;
}
