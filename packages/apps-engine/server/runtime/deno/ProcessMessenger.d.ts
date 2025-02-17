import type { ChildProcess } from 'child_process';
export declare class ProcessMessenger {
    private readonly debug;
    private deno;
    private encoder;
    private _sendStrategy;
    constructor(debug: debug.Debugger);
    get send(): any;
    setReceiver(deno: ChildProcess): void;
    clearReceiver(): void;
    private switchStrategy;
    private strategyError;
    private strategySend;
}
