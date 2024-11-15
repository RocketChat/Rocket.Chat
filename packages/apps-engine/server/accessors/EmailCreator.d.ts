import type { IEmailCreator } from '../../definition/accessors/IEmailCreator';
import type { IEmail } from '../../definition/email';
import type { AppBridges } from '../bridges';
export declare class EmailCreator implements IEmailCreator {
    private readonly bridges;
    private readonly appId;
    constructor(bridges: AppBridges, appId: string);
    send(email: IEmail): Promise<void>;
}
