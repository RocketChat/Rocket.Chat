import type { IProcessor } from '../scheduler';

/**
 * Registers the job processors an App can schedule work against.
 *
 * Every processor the App will ever schedule has to be registered here, from
 * `extendConfiguration`; `ISchedulerModify` then schedules jobs against them.
 * It needs the `scheduler` permission.
 */
export interface ISchedulerExtend {
	/**
	 * Register processors that can be scheduled to run
	 *
	 * @param {Array<IProcessor>} processors An array of processors
	 * @returns List of task ids run at startup, or void no startup run is set
	 */
	registerProcessors(processors: Array<IProcessor>): Promise<void | Array<string>>;
}
