import type { IInternalBridge } from '../../bridges';
export declare class Crypto {
    private readonly internalBridge;
    constructor(internalBridge: IInternalBridge);
    decryptLicense(content: string): Promise<object>;
}
