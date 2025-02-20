import type { AppManager } from '../AppManager';
import type { UserBridge } from '../bridges';
import type { IInternalUserBridge } from '../bridges/IInternalUserBridge';
import { InvalidLicenseError } from '../errors';
import type { IMarketplaceInfo } from '../marketplace';
import { MarketplacePurchaseType } from '../marketplace/MarketplacePurchaseType';
import { Crypto } from '../marketplace/license';
import type { AppLicenseValidationResult } from '../marketplace/license';

enum LicenseVersion {
    v1 = 1,
}

export class AppLicenseManager {
    private readonly crypto: Crypto;

    private readonly userBridge: UserBridge;

    constructor(private readonly manager: AppManager) {
        this.crypto = new Crypto(this.manager.getBridges().getInternalBridge());
        this.userBridge = this.manager.getBridges().getUserBridge();
    }

    public async validate(validationResult: AppLicenseValidationResult, appMarketplaceInfo?: IMarketplaceInfo[]): Promise<void> {
        const marketplaceInfo = appMarketplaceInfo?.[0];
        if (!marketplaceInfo || marketplaceInfo.purchaseType !== MarketplacePurchaseType.PurchaseTypeSubscription) {
            return;
        }

        validationResult.setValidated(true);

        const encryptedLicense = marketplaceInfo.subscriptionInfo.license.license;

        if (!encryptedLicense) {
            validationResult.addError('license', 'License for app is invalid');

            throw new InvalidLicenseError(validationResult);
        }

        let license;
        try {
            license = (await this.crypto.decryptLicense(encryptedLicense)) as any;
        } catch (err) {
            validationResult.addError('publicKey', err.message);

            throw new InvalidLicenseError(validationResult);
        }

        switch (license.version) {
            case LicenseVersion.v1:
                await this.validateV1(marketplaceInfo, license, validationResult);
                break;
        }
    }

    private async validateV1(appMarketplaceInfo: IMarketplaceInfo, license: any, validationResult: AppLicenseValidationResult): Promise<void> {
        if (license.isBundle && (!appMarketplaceInfo.bundledIn || !appMarketplaceInfo.bundledIn.find((value) => value.bundleId === license.appId))) {
            validationResult.addError('bundle', 'License issued for a bundle that does not contain the app');
        } else if (!license.isBundle && license.appId !== appMarketplaceInfo.id) {
            validationResult.addError('appId', `License hasn't been issued for this app`);
        }

        const renewal = new Date(license.renewalDate);
        const expire = new Date(license.expireDate);
        const now = new Date();

        if (expire < now) {
            validationResult.addError('expire', 'License is no longer valid and needs to be renewed');
        }

        const currentActiveUsers = await (this.userBridge as UserBridge & IInternalUserBridge).getActiveUserCount();

        if (license.maxSeats < currentActiveUsers) {
            validationResult.addError('maxSeats', 'License does not accomodate the current amount of active users. Please increase the number of seats');
        }

        if (validationResult.hasErrors) {
            throw new InvalidLicenseError(validationResult);
        }

        if (renewal < now) {
            validationResult.addWarning('renewal', 'License has expired and needs to be renewed');
        }

        if (license.seats < currentActiveUsers) {
            validationResult.addWarning(
                'seats',
                'License does not have enough seats to accommodate the current amount of active users. Please increase the number of seats',
            );
        }
    }
}
