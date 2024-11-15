import { BaseBridge } from './BaseBridge';
import type { IOnetimeSchedule, IProcessor, IRecurringSchedule } from '../../definition/scheduler';
export declare abstract class SchedulerBridge extends BaseBridge {
    doRegisterProcessors(processors: Array<IProcessor>, appId: string): Promise<void | Array<string>>;
    doScheduleOnce(job: IOnetimeSchedule, appId: string): Promise<void | string>;
    doScheduleRecurring(job: IRecurringSchedule, appId: string): Promise<void | string>;
    doCancelJob(jobId: string, appId: string): Promise<void>;
    doCancelAllJobs(appId: string): Promise<void>;
    protected abstract registerProcessors(processors: Array<IProcessor>, appId: string): Promise<void | Array<string>>;
    protected abstract scheduleOnce(job: IOnetimeSchedule, appId: string): Promise<void | string>;
    protected abstract scheduleRecurring(job: IRecurringSchedule, appId: string): Promise<void | string>;
    protected abstract cancelJob(jobId: string, appId: string): Promise<void>;
    protected abstract cancelAllJobs(appId: string): Promise<void>;
    private hasDefaultPermission;
}
