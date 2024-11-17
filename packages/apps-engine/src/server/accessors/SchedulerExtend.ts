import type { ISchedulerExtend } from '../../definition/accessors';
import type { IProcessor } from '../../definition/scheduler';
import type { AppSchedulerManager } from '../managers/AppSchedulerManager';

export class SchedulerExtend implements ISchedulerExtend {
    constructor(
        private readonly manager: AppSchedulerManager,
        private readonly appId: string,
    ) {}

    public async registerProcessors(processors: Array<IProcessor> = []): Promise<void | Array<string>> {
        return this.manager.registerProcessors(processors, this.appId);
    }
}
