import type { Job } from '@rocket.chat/agenda';

export interface IOmniEEService {
	monitorOnHoldRoomForAutoClose(roomId: string, timeout: number, comment: string): Promise<void>;
	cancelMonitorOnHoldRoomForAutoClose(roomId: string): Promise<void>;
	autoCloseOnHoldChat(job: Job): Promise<void>;

	monitorUnansweredRoomForAutoTransfer(roomId: string, timeout: number): Promise<void>;
	cancelMonitorUnansweredRoomForAutoTransfer(roomId: string): Promise<void>;
	autoTransferUnansweredChat(job: Job): Promise<void>;
}
