import type { ISchedulerModify } from '../../definition/accessors';
import type { IOnetimeSchedule, IRecurringSchedule } from '../../definition/scheduler';
import type { SchedulerBridge } from '../bridges';

function createProcessorId(jobId: string, appId: string): string {
    return jobId.includes(`_${appId}`) ? jobId : `${jobId}_${appId}`;
}

export class SchedulerModify implements ISchedulerModify {
    constructor(private readonly bridge: SchedulerBridge, private readonly appId: string) {}

    public async scheduleOnce(job: IOnetimeSchedule): Promise<void | string> {
        return this.bridge.doScheduleOnce({ ...job, id: createProcessorId(job.id, this.appId) }, this.appId);
    }

    public async scheduleRecurring(job: IRecurringSchedule): Promise<void | string> {
        return this.bridge.doScheduleRecurring({ ...job, id: createProcessorId(job.id, this.appId) }, this.appId);
    }

    public async cancelJob(jobId: string): Promise<void> {
        return this.bridge.doCancelJob(createProcessorId(jobId, this.appId), this.appId);
    }

    public async cancelAllJobs(): Promise<void> {
        return this.bridge.doCancelAllJobs(this.appId);
    }
}
