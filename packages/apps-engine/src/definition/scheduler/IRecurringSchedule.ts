/** Represents a job that runs recurrently */
export interface IRecurringSchedule {
    /** The schedule's identifier */
    id: string;
    /**
     * The interval at which the job will be run.
     * Values can be a cron string, a [human-interval](https://github.com/agenda/human-interval) string
     * or a number.
     */
    interval: string | number;
    /**
     * Whether the recurring job should start immediately or wait for the interval
     */
    skipImmediate?: boolean;
    /** An object that can be passed to the processor with custom data */
    data?: object;
}
