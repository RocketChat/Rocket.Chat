import type { ChildProcess } from 'child_process';
import { EventEmitter } from 'stream';

import type { DenoRuntimeSubprocessController } from './AppsEngineDenoRuntime';
import type { ProcessMessenger } from './ProcessMessenger';

const COMMAND_PING = '_zPING';

const defaultOptions: LivenessManager['options'] = {
    pingRequestTimeout: 1000,
    pingFrequencyInMS: 10000,
    consecutiveTimeoutLimit: 4,
    maxRestarts: Infinity,
    restartAttemptDelayInMS: 1000,
};

/**
 * Responsible for pinging the Deno subprocess and for restarting it
 * if something doesn't look right
 */
export class LivenessManager {
    private readonly controller: DenoRuntimeSubprocessController;

    private readonly messenger: ProcessMessenger;

    private readonly debug: debug.Debugger;

    private readonly options: {
        // How long should we wait for a response to the ping request
        pingRequestTimeout: number;

        // How long is the delay between ping messages
        pingFrequencyInMS: number;

        // Limit of times the process can timeout the ping response before we consider it as unresponsive
        consecutiveTimeoutLimit: number;

        // Limit of times we can try to restart a process
        maxRestarts: number;

        // Time to delay the next restart attempt after a failed one
        restartAttemptDelayInMS: number;
    };

    private subprocess: ChildProcess;

    // This is the perfect use-case for an AbortController, but it's experimental in Node 14.x
    private pingAbortController: EventEmitter;

    private pingTimeoutConsecutiveCount = 0;

    private restartCount = 0;

    private restartLog: Record<string, unknown>[] = [];

    constructor(
        deps: {
            controller: DenoRuntimeSubprocessController;
            messenger: ProcessMessenger;
            debug: debug.Debugger;
        },
        options: Partial<LivenessManager['options']> = {},
    ) {
        this.controller = deps.controller;
        this.messenger = deps.messenger;
        this.debug = deps.debug;
        this.pingAbortController = new EventEmitter();

        this.options = Object.assign({}, defaultOptions, options);

        this.controller.on('ready', () => this.ping());
        this.controller.on('error', async (reason) => {
            if (reason instanceof Error && reason.message.startsWith('DECODE_ERROR')) {
                await this.restartProcess('Decode error', 'controller');
            }
        })
    }

    public getRuntimeData() {
        const { restartCount, pingTimeoutConsecutiveCount, restartLog } = this;

        return {
            restartCount,
            pingTimeoutConsecutiveCount,
            restartLog,
        };
    }

    public attach(deno: ChildProcess) {
        this.subprocess = deno;

        this.pingTimeoutConsecutiveCount = 0;

        this.subprocess.once('exit', this.handleExit.bind(this));
        this.subprocess.once('error', this.handleError.bind(this));
    }

    /**
     * Start up the process of ping/pong for liveness check
     *
     * The message exchange does not use JSON RPC as it adds a lot of overhead
     * with the creation and encoding of a full object for transfer. By using a
     * string the process is less intensive.
     */
    private ping() {
        const start = Date.now();

        let aborted = false;

        const setAborted = () => {
            this.debug('Ping aborted');

            aborted = true;
        };

        // If we get an abort, ping should not continue
        this.pingAbortController.once('abort', setAborted);

        new Promise<void>((resolve, reject) => {
            const onceCallback = () => {
                this.debug('Ping successful in %d ms', Date.now() - start);
                clearTimeout(timeoutId);
                this.pingTimeoutConsecutiveCount = 0;
                resolve();
            };

            const timeoutCallback = () => {
                this.debug('Ping failed in %d ms (consecutive failure #%d)', Date.now() - start, this.pingTimeoutConsecutiveCount);
                this.controller.off('pong', onceCallback);
                this.pingTimeoutConsecutiveCount++;
                reject('timeout');
            };

            const timeoutId = setTimeout(timeoutCallback, this.options.pingRequestTimeout);

            this.controller.once('pong', onceCallback);
        })
            .then(() => !aborted)
            .catch((reason) => {
                if (aborted) {
                    return false;
                }

                if (reason === 'timeout' && this.pingTimeoutConsecutiveCount >= this.options.consecutiveTimeoutLimit) {
                    this.debug('Subprocess failed to respond to pings %d consecutive times. Attempting restart...', this.options.consecutiveTimeoutLimit);
                    this.restartProcess('Too many pings timed out');
                    return false;
                }

                return true;
            })
            .then((shouldContinue) => {
                if (!shouldContinue) {
                    this.pingAbortController.off('abort', setAborted);
                    return;
                }

                setTimeout(() => {
                    if (aborted) return;

                    this.pingAbortController.off('abort', setAborted);
                    this.ping();
                }, this.options.pingFrequencyInMS);
            });

        this.messenger.send(COMMAND_PING);
    }

    private handleError(err: Error) {
        this.debug('App has failed to start.`', err);
        this.restartProcess(err.message);
    }

    private handleExit(exitCode: number, signal: string) {
        this.pingAbortController.emit('abort');

        const processState = this.controller.getProcessState();
        // If the we're restarting the process, or want to stop the process, or it exited cleanly, nothing else for us to do
        if (processState === 'restarting' || processState === 'stopped' || (exitCode === 0 && !signal)) {
            return;
        }

        let reason: string;

        // Otherwise we try to restart the subprocess, if possible
        if (signal) {
            this.debug('App has been killed (%s). Attempting restart #%d...', signal, this.restartCount + 1);
            reason = `App has been killed with signal ${signal}`;
        } else {
            this.debug('App has exited with code %d. Attempting restart #%d...', exitCode, this.restartCount + 1);
            reason = `App has exited with code ${exitCode}`;
        }

        this.restartProcess(reason);
    }

    private async restartProcess(reason: string, source = 'liveness-manager') {
        if (this.restartCount >= this.options.maxRestarts) {
            this.debug('Limit of restarts reached (%d). Aborting restart...', this.options.maxRestarts);
            this.controller.stopApp();
            return;
        }

        this.restartLog.push({
            reason,
            source,
            restartedAt: new Date(),
            pid: this.subprocess.pid,
        });

        try {
            await this.controller.restartApp();
        } catch (e) {
            this.debug('Restart attempt failed. Retrying in %dms', this.options.restartAttemptDelayInMS);
            setTimeout(() => this.restartProcess('Failed restart attempt'), this.options.restartAttemptDelayInMS);
        }

        this.pingTimeoutConsecutiveCount = 0;
        this.restartCount++;
    }
}
