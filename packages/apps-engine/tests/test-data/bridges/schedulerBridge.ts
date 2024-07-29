import type { IOnetimeSchedule, IProcessor, IRecurringSchedule } from '../../../src/definition/scheduler';
import { SchedulerBridge } from '../../../src/server/bridges';

export class TestSchedulerBridge extends SchedulerBridge {
    public async registerProcessors(processors: Array<IProcessor>, appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async scheduleOnce(job: IOnetimeSchedule, appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async scheduleRecurring(job: IRecurringSchedule, appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async cancelJob(jobId: string, appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    public async cancelAllJobs(appId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
