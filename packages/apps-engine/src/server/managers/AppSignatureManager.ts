import { createHash } from 'crypto';

import * as jose from 'jose';

import type { AppManager } from '../AppManager';
import type { IInternalFederationBridge } from '../bridges';
import type { IAppStorageItem } from '../storage';

export class AppSignatureManager {
    private readonly federationBridge: IInternalFederationBridge;

    private readonly checksumAlgorithm = 'SHA256';

    private readonly signingAlgorithm = 'RS512';

    private privateKey: string;

    private publicKey: string;

    constructor(private readonly manager: AppManager) {
        this.federationBridge = this.manager.getBridges().getInternalFederationBridge();
    }

    public async verifySignedApp(app: IAppStorageItem): Promise<void> {
        const publicKey = await jose.importSPKI(await this.getPublicKey(), 'pem');
        const { payload } = await jose.jwtVerify(app.signature, publicKey);

        const checksum = this.calculateChecksumForApp(app);

        if (payload.checksum !== checksum) {
            throw new Error('Invalid checksum');
        }
    }

    public async signApp(app: IAppStorageItem): Promise<string> {
        const checksum = this.calculateChecksumForApp(app);
        const privateKey = await jose.importPKCS8(await this.getPrivateKey(), this.signingAlgorithm);
        const signature = await new jose.SignJWT({ checksum, calg: this.checksumAlgorithm })
            .setProtectedHeader({ alg: this.signingAlgorithm })
            .setIssuedAt()
            .sign(privateKey);

        return signature;
    }

    private async getPrivateKey(): Promise<string> {
        if (!this.privateKey) {
            this.privateKey = await this.federationBridge.getPrivateKey();
        }
        return this.privateKey;
    }

    private async getPublicKey(): Promise<string> {
        if (!this.publicKey) {
            this.publicKey = await this.federationBridge.getPublicKey();
        }
        return this.publicKey;
    }

    private calculateChecksumForApp(app: IAppStorageItem, alg = this.checksumAlgorithm): string {
        return createHash(alg).update(this.getFieldsForChecksum(app)).digest('hex');
    }

    private getFieldsForChecksum(obj: IAppStorageItem): string {
        // These fields don't hold valuable information and should NOT invalidate
        // the checksum
        const fieldsToIgnore = ['_id', 'status', 'signature', 'updatedAt', 'createdAt', '_updatedAt', '_createdAt', 'settings'];

        // TODO revisit algorithm
        const allKeys: Array<string> = [];
        const seen: Record<string, unknown> = {};

        JSON.stringify(obj, (key, value) => {
            if (!(key in seen)) {
                allKeys.push(key);
                seen[key] = null;
            }
            return value;
        });

        const filteredKeys = allKeys.sort().filter((key) => !fieldsToIgnore.includes(key));

        return JSON.stringify(obj, filteredKeys);
    }
}
