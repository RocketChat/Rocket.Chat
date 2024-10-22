import { ChildProcess } from 'child_process';

import type { JsonRpc } from 'jsonrpc-lite';

import { encoder } from './codec';

export class ProcessMessenger {
    private deno: ChildProcess;

    private _sendStrategy: (message: JsonRpc) => void;

    constructor(private readonly debug: debug.Debugger) {
        this._sendStrategy = this.strategyError;
    }

    public get send() {
        return this._sendStrategy.bind(this);
    }

    public setReceiver(deno: ChildProcess) {
        this.deno = deno;

        this.switchStrategy();
    }

    public clearReceiver() {
        delete this.deno;

        this.switchStrategy();
    }

    private switchStrategy() {
        if (this.deno instanceof ChildProcess) {
            this._sendStrategy = this.strategySend.bind(this);
        } else {
            this._sendStrategy = this.strategyError.bind(this);
        }
    }

    private strategyError(_message: JsonRpc) {
        throw new Error('No process configured to receive a message');
    }

    private strategySend(message: JsonRpc) {
        this.debug('Sending message to subprocess %o', message);
        this.deno.stdin.write(encoder.encode(message));
    }
}
