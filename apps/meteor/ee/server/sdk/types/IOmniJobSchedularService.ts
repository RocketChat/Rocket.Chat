import type { Job } from '@rocket.chat/agenda';

export interface IOmniJobSchedulerService {
	scheduleJobAt<T extends { roomId: string; [key: string]: any }>(name: string, time: Date, data: T): Promise<Job>;
	cancelJobByRoomId(jobName: string, roomId: string): Promise<number>;
}
