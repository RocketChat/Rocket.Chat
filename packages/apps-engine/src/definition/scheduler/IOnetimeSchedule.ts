/** Represents a job that runs only once */
export interface IOnetimeSchedule {
    /** The schedule's identifier */
    id: string;
    /**
     * The time at which the job will be run.
     * Values can be a [human-interval](https://github.com/agenda/human-interval) string
     * or a `Date` object.
     */
    when: string | Date;
    /** An object that can be passed to the processor with custom data */
    data?: object;
}
