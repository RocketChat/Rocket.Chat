export interface IInternalSchedulerBridge {
    /**
     * Cancels all the running jobs from the app
     * For apps-engine's internal use
     * @param appId the id of the app calling this
     */
    cancelAllJobs(appId: string): Promise<void>;
}
