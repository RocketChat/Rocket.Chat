import type { CallNotification } from '../../call';
export type ServerMediaSignalNotification = {
    callId: string;
    type: 'notification';
    notification: CallNotification;
    signedContractId?: string;
};
//# sourceMappingURL=notification.d.ts.map