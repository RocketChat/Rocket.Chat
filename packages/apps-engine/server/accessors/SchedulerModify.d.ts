import type { ISchedulerModify } from '../../definition/accessors';
import type { IOnetimeSchedule, IRecurringSchedule } from '../../definition/scheduler';
import type { SchedulerBridge } from '../bridges';
export declare class SchedulerModify implements ISchedulerModify {
    private readonly bridge;
    private readonly appId;
    constructor(bridge: SchedulerBridge, appId: string);
    scheduleOnce(job: IOnetimeSchedule): Promise<void | string>;
    scheduleRecurring(job: IRecurringSchedule): Promise<void | string>;
    cancelJob(jobId: string): Promise<void>;
    cancelAllJobs(): Promise<void>;
}
