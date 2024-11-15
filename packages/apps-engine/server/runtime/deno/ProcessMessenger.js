"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessMessenger = void 0;
const child_process_1 = require("child_process");
const codec_1 = require("./codec");
class ProcessMessenger {
    constructor(debug) {
        this.debug = debug;
        this._sendStrategy = this.strategyError;
    }
    get send() {
        return this._sendStrategy.bind(this);
    }
    setReceiver(deno) {
        this.deno = deno;
        this.switchStrategy();
    }
    clearReceiver() {
        delete this.deno;
        this.switchStrategy();
    }
    switchStrategy() {
        if (this.deno instanceof child_process_1.ChildProcess) {
            this._sendStrategy = this.strategySend.bind(this);
        }
        else {
            this._sendStrategy = this.strategyError.bind(this);
        }
    }
    strategyError(_message) {
        throw new Error('No process configured to receive a message');
    }
    strategySend(message) {
        this.debug('Sending message to subprocess %o', message);
        this.deno.stdin.write(codec_1.encoder.encode(message));
    }
}
exports.ProcessMessenger = ProcessMessenger;
//# sourceMappingURL=ProcessMessenger.js.map