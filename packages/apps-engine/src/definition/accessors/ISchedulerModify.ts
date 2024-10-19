import type { IOnetimeSchedule, IRecurringSchedule } from '../scheduler';

/**
 * This accessor provides methods to work with the Job Scheduler
 */
export interface ISchedulerModify {
    /**
     * Schedules a registered processor to run _once_.
     *
     * @param {IOnetimeSchedule} job
     * @returns jobid as string
     */
    scheduleOnce(job: IOnetimeSchedule): Promise<void | string>;
    /**
     * Schedules a registered processor to run in recurrencly according to a given interval
     *
     * @param {IRecurringSchedule} job
     * @returns jobid as string
     */
    scheduleRecurring(job: IRecurringSchedule): Promise<void | string>;
    /**
     * Cancels a running job given its jobId
     *
     * @param {string} jobId
     */
    cancelJob(jobId: string): Promise<void>;
    /**
     * Cancels all the running jobs from the app
     */
    cancelAllJobs(): Promise<void>;
}
