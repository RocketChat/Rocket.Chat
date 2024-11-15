import type { ILogEntry } from '../../definition/accessors';
import type { AppMethod } from '../../definition/metadata';
export interface ILoggerStorageEntry {
    appId: string;
    method: `${AppMethod}`;
    entries: Array<ILogEntry>;
    startTime: Date;
    endTime: Date;
    totalTime: number;
    instanceId?: string;
    _createdAt: Date;
}
