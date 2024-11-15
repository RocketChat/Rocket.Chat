export declare enum LogMessageSeverity {
    DEBUG = "debug",
    INFORMATION = "info",
    LOG = "log",
    WARNING = "warning",
    ERROR = "error",
    SUCCESS = "success"
}
/**
 * Message which will be passed to a UI (either in a log or in the application's UI)
 */
export interface ILogEntry {
    /** The function name who did this logging, this is automatically added (can be null). */
    caller?: string;
    /** The severity rate, this is automatically added. */
    severity: LogMessageSeverity;
    /** When this entry was made. */
    timestamp: Date;
    /** The items which were logged. */
    args: Array<any>;
}
