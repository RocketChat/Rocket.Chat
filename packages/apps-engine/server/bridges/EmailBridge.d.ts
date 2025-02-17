import { BaseBridge } from './BaseBridge';
import type { IEmail } from '../../definition/email';
export declare abstract class EmailBridge extends BaseBridge {
    doSendEmail(email: IEmail, appId: string): Promise<void>;
    protected abstract sendEmail(email: IEmail, appId: string): Promise<void>;
    private hasWritePermission;
}
