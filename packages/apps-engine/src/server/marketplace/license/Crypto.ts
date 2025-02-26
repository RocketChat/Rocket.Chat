import { publicDecrypt } from 'crypto';

import type { IInternalBridge } from '../../bridges';

export class Crypto {
    constructor(private readonly internalBridge: IInternalBridge) {}

    public async decryptLicense(content: string): Promise<object> {
        const publicKeySetting = await this.internalBridge.doGetWorkspacePublicKey();

        if (!publicKeySetting || !publicKeySetting.value) {
            throw new Error('Public key not available, cannot decrypt'); // TODO: add custom error?
        }

        const decoded = publicDecrypt(publicKeySetting.value, Buffer.from(content, 'base64'));

        let license;
        try {
            license = JSON.parse(decoded.toString());
        } catch (error) {
            throw new Error('Invalid license provided');
        }

        return license;
    }
}
