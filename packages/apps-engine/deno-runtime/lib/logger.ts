import stackTrace from 'stack-trace';
import { AppObjectRegistry } from '../AppObjectRegistry.ts';

export interface StackFrame {
    getTypeName(): string;
    getFunctionName(): string;
    getMethodName(): string;
    getFileName(): string;
    getLineNumber(): number;
    getColumnNumber(): number;
    isNative(): boolean;
    isConstructor(): boolean;
}

enum LogMessageSeverity {
    DEBUG = 'debug',
    INFORMATION = 'info',
    LOG = 'log',
    WARNING = 'warning',
    ERROR = 'error',
    SUCCESS = 'success',
}

type Entry = {
    caller: string;
    severity: LogMessageSeverity;
    method: string;
    timestamp: Date;
    args: Array<unknown>;
};

interface ILoggerStorageEntry {
    appId: string;
    method: string;
    entries: Array<Entry>;
    startTime: Date;
    endTime: Date;
    totalTime: number;
    _createdAt: Date;
}

export class Logger {
    private entries: Array<Entry>;
    private start: Date;
    private method: string;

    constructor(method: string) {
        this.method = method;
        this.entries = [];
        this.start = new Date();
    }

    public debug(...args: Array<unknown>): void {
        this.addEntry(LogMessageSeverity.DEBUG, this.getStack(stackTrace.get()), ...args);
    }

    public info(...args: Array<unknown>): void {
        this.addEntry(LogMessageSeverity.INFORMATION, this.getStack(stackTrace.get()), ...args);
    }

    public log(...args: Array<unknown>): void {
        this.addEntry(LogMessageSeverity.LOG, this.getStack(stackTrace.get()), ...args);
    }

    public warn(...args: Array<unknown>): void {
        this.addEntry(LogMessageSeverity.WARNING, this.getStack(stackTrace.get()), ...args);
    }

    public error(...args: Array<unknown>): void {
        this.addEntry(LogMessageSeverity.ERROR, this.getStack(stackTrace.get()), ...args);
    }

    public success(...args: Array<unknown>): void {
        this.addEntry(LogMessageSeverity.SUCCESS, this.getStack(stackTrace.get()), ...args);
    }

    private addEntry(severity: LogMessageSeverity, caller: string, ...items: Array<unknown>): void {
        const i = items.map((args) => {
            if (args instanceof Error) {
                return JSON.stringify(args, Object.getOwnPropertyNames(args));
            }
            if (typeof args === 'object' && args !== null && 'stack' in args) {
                return JSON.stringify(args, Object.getOwnPropertyNames(args));
            }
            if (typeof args === 'object' && args !== null && 'message' in args) {
                return JSON.stringify(args, Object.getOwnPropertyNames(args));
            }
            const str = JSON.stringify(args, null, 2);
            return str ? JSON.parse(str) : str; // force call toJSON to prevent circular references
        });

        this.entries.push({
            caller,
            severity,
            method: this.method,
            timestamp: new Date(),
            args: i,
        });
    }

    private getStack(stack: Array<StackFrame>): string {
        let func = 'anonymous';

        if (stack.length === 1) {
            return func;
        }

        const frame = stack[1];

        if (frame.getMethodName() === null) {
            func = 'anonymous OR constructor';
        } else {
            func = frame.getMethodName();
        }

        if (frame.getFunctionName() !== null) {
            func = `${func} -> ${frame.getFunctionName()}`;
        }

        return func;
    }

    private getTotalTime(): number {
        return new Date().getTime() - this.start.getTime();
    }

    public hasEntries(): boolean {
        return this.entries.length > 0;
    }

    public getLogs(): ILoggerStorageEntry {
        return {
            appId: AppObjectRegistry.get('id')!,
            method: this.method,
            entries: this.entries,
            startTime: this.start,
            endTime: new Date(),
            totalTime: this.getTotalTime(),
            _createdAt: new Date(),
        };
    }
}
