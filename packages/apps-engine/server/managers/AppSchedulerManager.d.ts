import type { IOnetimeSchedule, IProcessor, IRecurringSchedule } from '../../definition/scheduler';
import type { AppManager } from '../AppManager';
export declare class AppSchedulerManager {
    private readonly manager;
    private readonly bridge;
    private registeredProcessors;
    constructor(manager: AppManager);
    registerProcessors(processors: Array<IProcessor>, appId: string): Promise<void | Array<string>>;
    wrapProcessor(appId: string, processorId: string): IProcessor['processor'];
    scheduleOnce(job: IOnetimeSchedule, appId: string): Promise<void | string>;
    scheduleRecurring(job: IRecurringSchedule, appId: string): Promise<void | string>;
    cancelJob(jobId: string, appId: string): Promise<void>;
    cancelAllJobs(appId: string): Promise<void>;
    cleanUp(appId: string): Promise<void>;
    private isNotToRunJob;
}
