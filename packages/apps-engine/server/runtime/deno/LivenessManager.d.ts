import type { ChildProcess } from 'child_process';
import type { DenoRuntimeSubprocessController } from './AppsEngineDenoRuntime';
import type { ProcessMessenger } from './ProcessMessenger';
/**
 * Responsible for pinging the Deno subprocess and for restarting it
 * if something doesn't look right
 */
export declare class LivenessManager {
    private readonly controller;
    private readonly messenger;
    private readonly debug;
    private readonly options;
    private subprocess;
    private pingAbortController;
    private pingTimeoutConsecutiveCount;
    private restartCount;
    private restartLog;
    constructor(deps: {
        controller: DenoRuntimeSubprocessController;
        messenger: ProcessMessenger;
        debug: debug.Debugger;
    }, options?: Partial<LivenessManager['options']>);
    getRuntimeData(): {
        restartCount: number;
        pingTimeoutConsecutiveCount: number;
        restartLog: Record<string, unknown>[];
    };
    attach(deno: ChildProcess): void;
    /**
     * Start up the process of ping/pong for liveness check
     *
     * The message exchange does not use JSON RPC as it adds a lot of overhead
     * with the creation and encoding of a full object for transfer. By using a
     * string the process is less intensive.
     */
    private ping;
    private handleExit;
    private restartProcess;
}
