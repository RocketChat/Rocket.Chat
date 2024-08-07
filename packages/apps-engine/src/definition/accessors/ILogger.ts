import type { AppMethod } from '../metadata/AppMethod';
import type { ILogEntry } from './ILogEntry';

/**
 * This logger provides a way to log various levels to the entire system.
 * When used, the items passed in will be logged to the database. This will
 * allow people to easily see what happened (users) or debug what went wrong.
 */
export interface ILogger {
    method: `${AppMethod}`;

    debug(...items: Array<any>): void;
    info(...items: Array<any>): void;
    log(...items: Array<any>): void;
    warn(...items: Array<any>): void;
    error(...items: Array<any>): void;
    success(...items: Array<any>): void;

    /** Gets the entries logged. */
    getEntries(): Array<ILogEntry>;
    /** Gets the method which this logger is for. */
    getMethod(): `${AppMethod}`;
    /** Gets when this logger was constructed. */
    getStartTime(): Date;
    /** Gets the end time, usually Date.now(). */
    getEndTime(): Date;
    /** Gets the amount of time this was a logger, start - Date.now(). */
    getTotalTime(): number;
}
