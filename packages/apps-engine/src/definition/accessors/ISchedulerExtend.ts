import type { IProcessor } from '../scheduler';

export interface ISchedulerExtend {
    /**
     * Register processors that can be scheduled to run
     *
     * @param {Array<IProcessor>} processors An array of processors
     * @returns List of task ids run at startup, or void no startup run is set
     */
    registerProcessors(processors: Array<IProcessor>): Promise<void | Array<string>>;
}
