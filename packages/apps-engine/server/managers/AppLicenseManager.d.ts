import type { AppManager } from '../AppManager';
import type { IMarketplaceInfo } from '../marketplace';
import type { AppLicenseValidationResult } from '../marketplace/license';
export declare class AppLicenseManager {
    private readonly manager;
    private readonly crypto;
    private readonly userBridge;
    constructor(manager: AppManager);
    validate(validationResult: AppLicenseValidationResult, appMarketplaceInfo?: IMarketplaceInfo): Promise<void>;
    private validateV1;
}
