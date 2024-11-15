import type { ILoggerStorageEntry } from './ILoggerStorageEntry';
import type { ILogEntry, ILogger } from '../../definition/accessors';
import type { AppMethod } from '../../definition/metadata';
export declare class AppConsole implements ILogger {
    static toStorageEntry(appId: string, logger: AppConsole): ILoggerStorageEntry;
    method: `${AppMethod}`;
    private entries;
    private start;
    constructor(method: `${AppMethod}`);
    debug(...items: Array<any>): void;
    info(...items: Array<any>): void;
    log(...items: Array<any>): void;
    warn(...items: Array<any>): void;
    error(...items: Array<any>): void;
    success(...items: Array<any>): void;
    getEntries(): Array<ILogEntry>;
    getMethod(): `${AppMethod}`;
    getStartTime(): Date;
    getEndTime(): Date;
    getTotalTime(): number;
    private addEntry;
    private getFunc;
}
