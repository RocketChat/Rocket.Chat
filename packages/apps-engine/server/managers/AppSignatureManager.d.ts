import type { AppManager } from '../AppManager';
import type { IAppStorageItem } from '../storage';
export declare class AppSignatureManager {
    private readonly manager;
    private readonly federationBridge;
    private readonly checksumAlgorithm;
    private readonly signingAlgorithm;
    private privateKey;
    private publicKey;
    constructor(manager: AppManager);
    verifySignedApp(app: IAppStorageItem): Promise<void>;
    signApp(app: IAppStorageItem): Promise<string>;
    private getPrivateKey;
    private getPublicKey;
    private calculateChecksumForApp;
    private getFieldsForChecksum;
}
